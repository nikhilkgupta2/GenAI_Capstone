from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal


def seed_subscription_plans(db):
    from app.models.subscription_plan import SubscriptionPlan
    if db.query(SubscriptionPlan).count() == 0:
        plans = [
            SubscriptionPlan(
                plan_code="free",
                name="Free Trial",
                price=0.0,
                max_users=5,
                max_warehouses=2,
                max_products=100,
                feature_barcode=False,
                feature_warehouses=True,
                feature_procurement=False,
                feature_analytics=False,
                feature_exports=False,
                feature_audit_logs=False,
                description="For small teams starting their inventory system.",
                storage_limit_gb=10,
            ),
            SubscriptionPlan(
                plan_code="pro",
                name="Professional",
                price=99.0,
                max_users=25,
                max_warehouses=10,
                max_products=5000,
                feature_barcode=True,
                feature_warehouses=True,
                feature_procurement=True,
                feature_analytics=True,
                feature_exports=True,
                feature_audit_logs=True,
                description="For retailers operating multi-warehouse configurations.",
                storage_limit_gb=50,
            ),
            SubscriptionPlan(
                plan_code="enterprise",
                name="Enterprise",
                price=499.0,
                max_users=9999,
                max_warehouses=9999,
                max_products=9999,
                feature_barcode=True,
                feature_warehouses=True,
                feature_procurement=True,
                feature_analytics=True,
                feature_exports=True,
                feature_audit_logs=True,
                description="For global logistics chains with high throughput.",
                storage_limit_gb=200,
            ),
        ]
        db.add_all(plans)
        db.commit()


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_subscription_plans(db)

    app = FastAPI(
        title=settings.project_name,
        version=settings.version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
