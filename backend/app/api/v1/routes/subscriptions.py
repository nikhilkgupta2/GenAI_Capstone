from __future__ import annotations

from datetime import UTC, datetime, timedelta
import hashlib
import hmac
from typing import Annotated, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_tenant_roles
from app.core.config import settings
from app.core.enums import UserRole
from app.models.subscription_plan import SubscriptionPlan
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.common import ApiResponse


router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])
DbSession = Annotated[Session, Depends(get_db)]
RetailerAdmin = Annotated[User, Depends(require_tenant_roles(UserRole.RETAILER_ADMIN))]


class CreateOrderRequest(BaseModel):
    plan_code: Literal["pro", "enterprise"]


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    plan_code: Literal["pro", "enterprise"]


class VerifyPaymentRequest(BaseModel):
    plan_code: Literal["pro", "enterprise"]
    razorpay_order_id: str = Field(min_length=8, max_length=128)
    razorpay_payment_id: str = Field(min_length=8, max_length=128)
    razorpay_signature: str = Field(min_length=8, max_length=256)


def _require_razorpay_keys() -> tuple[str, str]:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured.",
        )
    return settings.razorpay_key_id, settings.razorpay_key_secret


def _plan_amount_paise(plan: SubscriptionPlan) -> int:
    # Prices in DB are in USD. For Razorpay INR, we use a 1:1 mapping for demo purposes.
    return int(plan.price * 100)


def _verify_signature(*, secret: str, order_id: str, payment_id: str, signature: str) -> bool:
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)

def _razorpay_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            error = payload.get("error")
            if isinstance(error, dict):
                description = error.get("description") or error.get("reason") or error.get("code")
                if description:
                    return str(description)
        return response.text[:500] if response.text else "Unknown error."
    except ValueError:
        return response.text[:500] if response.text else "Unknown error."


@router.post("/create-order", response_model=ApiResponse)
def create_order(payload: CreateOrderRequest, db: DbSession, current_user: RetailerAdmin) -> ApiResponse:
    key_id, key_secret = _require_razorpay_keys()

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.plan_code == payload.plan_code).one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")

    amount = _plan_amount_paise(plan)
    # receipt = f"tenant_{tenant.id}_{payload.plan_code}_{int(datetime.now(tz=UTC).timestamp())}"
    receipt = f"t{str(tenant.id)[:6]}_{payload.plan_code}"

    try:
        with httpx.Client(timeout=httpx.Timeout(15.0, connect=10.0)) as client:
            response = client.post(
                "https://api.razorpay.com/v1/orders",
                auth=(key_id, key_secret),
                json={
                    "amount": amount,
                    "currency": "INR",
                    "receipt": receipt,
                    "notes": {
                        "tenant_id": str(tenant.id),
                        "plan_code": payload.plan_code,
                        },
                },
            )
            print(response.status_code)
            print(response.text)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = _razorpay_error_detail(exc.response)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create billing order: {detail}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Billing provider unavailable: {exc.__class__.__name__}",
        ) from exc

    order = response.json()
    data = CreateOrderResponse(
        order_id=str(order.get("id")),
        amount=int(order.get("amount") or amount),
        currency=str(order.get("currency") or "INR"),
        key_id=key_id,
        plan_code=payload.plan_code,
    )
    return ApiResponse(message="Order created.", data=data.model_dump())


@router.post("/verify", response_model=ApiResponse)
def verify_payment(payload: VerifyPaymentRequest, db: DbSession, current_user: RetailerAdmin) -> ApiResponse:
    _, key_secret = _require_razorpay_keys()

    if not _verify_signature(
        secret=key_secret,
        order_id=payload.razorpay_order_id,
        payment_id=payload.razorpay_payment_id,
        signature=payload.razorpay_signature,
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment signature verification failed.")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.plan_code == payload.plan_code).one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")

    tenant.plan = plan.plan_code
    tenant.max_users = plan.max_users
    tenant.max_warehouses = plan.max_warehouses
    tenant.max_products = plan.max_products
    tenant.feature_barcode = plan.feature_barcode
    tenant.feature_warehouses = plan.feature_warehouses
    tenant.feature_procurement = plan.feature_procurement
    tenant.feature_analytics = plan.feature_analytics
    tenant.feature_exports = plan.feature_exports
    tenant.feature_audit_logs = plan.feature_audit_logs

    now = datetime.now(tz=UTC)
    tenant.subscription_status = "active"
    tenant.subscription_start_date = now
    tenant.subscription_end_date = now + timedelta(days=30)

    from app.models.subscription_payment import SubscriptionPayment

    payment = SubscriptionPayment(
        tenant_id=tenant.id,
        actor_id=current_user.id,
        plan_code=plan.plan_code,
        amount=plan.price,
        currency="INR",
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        status="paid",
    )
    db.add(payment)
    db.commit()

    return ApiResponse(message="Subscription upgraded.", data={"upgraded": True, "plan": plan.plan_code})

@router.get("/plans", response_model=ApiResponse)
def list_plans(db: DbSession, current_user: RetailerAdmin) -> ApiResponse:
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.plan_code != 'free').order_by(SubscriptionPlan.price.asc()).all()
    data = []
    for plan in plans:
        data.append({
            "plan_code": plan.plan_code,
            "name": plan.name,
            "price": plan.price,
            "max_users": plan.max_users,
            "max_warehouses": plan.max_warehouses,
            "max_products": plan.max_products,
            "feature_barcode": plan.feature_barcode,
            "feature_warehouses": plan.feature_warehouses,
            "feature_procurement": plan.feature_procurement,
            "feature_analytics": plan.feature_analytics,
            "feature_exports": plan.feature_exports,
            "feature_audit_logs": plan.feature_audit_logs,
            "description": plan.description,
            "storage_limit_gb": plan.storage_limit_gb,
        })
    return ApiResponse(message="Plans fetched successfully.", data=data)
