from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ai.permissions import can_use_tool
from app.ai.schemas import ToolResult
from app.core.enums import PurchaseOrderStatus, TenantStatus
from app.models.audit_log import AuditLog, StockAdjustmentRequest
from app.models.inventory_transaction import InventoryTransaction
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.models.supplier import Supplier
from app.models.tenant import Tenant
from app.models.user import User
from app.models.warehouse import Warehouse, WarehouseInventory


def _denied(tool_name: str, source: str) -> ToolResult:
    return ToolResult(name=tool_name, allowed=False, source=source, data=[], message="You do not have access to this data.")


def _tenant_required(tool_name: str, source: str) -> ToolResult:
    return ToolResult(name=tool_name, allowed=False, source=source, data=[], message="This request requires a tenant-scoped workspace.")


def _warehouse_filter(query, user: User):
    if user.role.value == "warehouse_staff" and user.assigned_warehouse:
        return query.filter(Product.warehouse_location == user.assigned_warehouse)
    return query


def _ensure_tenant(user: User) -> UUID | None:
    return user.tenant_id


def get_low_stock_products(db: Session, user: User) -> ToolResult:
    name = "get_low_stock_products"
    if not can_use_tool(user.role, name):
        return _denied(name, "products")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "products")
    query = db.query(Product).filter(Product.tenant_id == tenant_id, Product.quantity <= 10)
    query = _warehouse_filter(query, user)
    rows = query.order_by(Product.quantity.asc(), Product.product_name.asc()).limit(20).all()
    data = [
        {
            "id": str(product.id),
            "name": product.product_name,
            "sku": product.sku,
            "quantity": product.quantity,
            "category": product.category,
            "warehouse_location": product.warehouse_location,
        }
        for product in rows
    ]
    return ToolResult(name=name, allowed=True, source="products", data=data)


def get_pending_purchase_orders(db: Session, user: User) -> ToolResult:
    name = "get_pending_purchase_orders"
    if not can_use_tool(user.role, name):
        return _denied(name, "purchase_orders")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "purchase_orders")
    rows = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.status == PurchaseOrderStatus.PENDING.value)
        .order_by(PurchaseOrder.updated_at.desc())
        .limit(20)
        .all()
    )
    data = [
        {
            "id": str(order.id),
            "po_number": order.po_number,
            "status": order.status,
            "supplier": order.supplier.name if order.supplier else None,
            "expected_delivery_date": order.expected_delivery_date.isoformat() if order.expected_delivery_date else None,
            "warehouse": order.warehouse.name if order.warehouse else None,
        }
        for order in rows
    ]
    return ToolResult(name=name, allowed=True, source="purchase_orders", data=data)


def get_inventory_summary(db: Session, user: User) -> ToolResult:
    name = "get_inventory_summary"
    if not can_use_tool(user.role, name):
        return _denied(name, "inventory")
    tenant_id = _ensure_tenant(user)
    
    # Super admin can view all tenants' data aggregated
    if user.role.value == "super_admin" and tenant_id is None:
        products = db.query(Product).all()
        total_products = len(products)
        total_units = sum(product.quantity for product in products)
        low_stock = sum(1 for product in products if product.quantity <= 10)
        total_value = sum(float(product.price or 0) * product.quantity for product in products)
        data = {
            "total_products": total_products,
            "total_units": total_units,
            "low_stock_count": low_stock,
            "estimated_inventory_value": round(total_value, 2),
            "scope": "platform_wide",
        }
        return ToolResult(name=name, allowed=True, source="products", data=data)
    
    if tenant_id is None:
        return _tenant_required(name, "inventory")
    query = db.query(Product).filter(Product.tenant_id == tenant_id)
    query = _warehouse_filter(query, user)
    products = query.all()
    total_products = len(products)
    total_units = sum(product.quantity for product in products)
    low_stock = sum(1 for product in products if product.quantity <= 10)
    total_value = sum(float(product.price or 0) * product.quantity for product in products)
    data = {
        "total_products": total_products,
        "total_units": total_units,
        "low_stock_count": low_stock,
        "estimated_inventory_value": round(total_value, 2),
        "warehouse_scope": user.assigned_warehouse if user.role.value == "warehouse_staff" else "all_allowed",
    }
    return ToolResult(name=name, allowed=True, source="products", data=data)


def get_supplier_performance(db: Session, user: User) -> ToolResult:
    name = "get_supplier_performance"
    if not can_use_tool(user.role, name):
        return _denied(name, "suppliers")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "suppliers")
    rows = (
        db.query(Supplier, func.count(PurchaseOrder.id).label("po_count"))
        .outerjoin(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .filter(Supplier.tenant_id == tenant_id)
        .group_by(Supplier.id)
        .order_by(func.count(PurchaseOrder.id).desc(), Supplier.name.asc())
        .limit(15)
        .all()
    )
    data = [
        {
            "id": str(supplier.id),
            "name": supplier.name,
            "status": supplier.status,
            "purchase_order_count": int(po_count),
            "contact_name": supplier.contact_name,
        }
        for supplier, po_count in rows
    ]
    return ToolResult(name=name, allowed=True, source="suppliers", data=data)


def get_recent_audit_logs(db: Session, user: User) -> ToolResult:
    name = "get_recent_audit_logs"
    if not can_use_tool(user.role, name):
        return _denied(name, "audit_logs")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "audit_logs")
    rows = (
        db.query(AuditLog)
        .filter(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.created_at.desc())
        .limit(20)
        .all()
    )
    data = [
        {
            "id": str(log.id),
            "module": log.module,
            "action": log.action,
            "entity_type": log.entity_type,
            "actor": log.actor.name if log.actor else None,
            "message": log.message,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in rows
    ]
    return ToolResult(name=name, allowed=True, source="audit_logs", data=data)


def get_warehouse_stock(db: Session, user: User) -> ToolResult:
    name = "get_warehouse_stock"
    if not can_use_tool(user.role, name):
        return _denied(name, "warehouse_inventory")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "warehouse_inventory")
    query = (
        db.query(WarehouseInventory)
        .join(Warehouse, Warehouse.id == WarehouseInventory.warehouse_id)
        .join(Product, Product.id == WarehouseInventory.product_id)
        .filter(WarehouseInventory.tenant_id == tenant_id)
    )
    if user.role.value == "warehouse_staff" and user.assigned_warehouse:
        query = query.filter(Warehouse.name == user.assigned_warehouse)
    rows = query.order_by(Warehouse.name.asc(), Product.product_name.asc()).limit(30).all()
    data = [
        {
            "warehouse": item.warehouse.name if item.warehouse else None,
            "product": item.product.product_name if item.product else None,
            "sku": item.product.sku if item.product else None,
            "quantity": item.quantity,
        }
        for item in rows
    ]
    return ToolResult(name=name, allowed=True, source="warehouse_inventory", data=data)


def get_pending_approvals(db: Session, user: User) -> ToolResult:
    name = "get_pending_approvals"
    if not can_use_tool(user.role, name):
        return _denied(name, "stock_adjustment_requests")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "stock_adjustment_requests")
    rows = (
        db.query(StockAdjustmentRequest)
        .filter(StockAdjustmentRequest.tenant_id == tenant_id, StockAdjustmentRequest.status == "pending")
        .order_by(StockAdjustmentRequest.created_at.desc())
        .limit(20)
        .all()
    )
    data = [
        {
            "id": str(request.id),
            "product": request.product.product_name if request.product else None,
            "quantity": request.quantity,
            "notes": request.notes,
            "requested_by": request.requester.name if request.requester else None,
            "created_at": request.created_at.isoformat() if request.created_at else None,
        }
        for request in rows
    ]
    return ToolResult(name=name, allowed=True, source="stock_adjustment_requests", data=data)


def get_platform_users(db: Session, user: User) -> ToolResult:
    name = "get_platform_users"
    if not can_use_tool(user.role, name):
        return _denied(name, "users")
    if user.role.value != "super_admin":
        return _denied(name, "users")

    user_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    data = {
        "total_users": db.query(User).count(),
        "by_role": {role.value: count for role, count in user_counts},
    }
    return ToolResult(name=name, allowed=True, source="users", data=data)


def get_platform_tenants(db: Session, user: User) -> ToolResult:
    name = "get_platform_tenants"
    if not can_use_tool(user.role, name):
        return _denied(name, "tenants")
    if user.role.value != "super_admin":
        return _denied(name, "tenants")

    status_counts = db.query(Tenant.status, func.count(Tenant.id)).group_by(Tenant.status).all()
    active_count = db.query(Tenant).filter(Tenant.status == TenantStatus.ACTIVE).count()
    total_count = db.query(Tenant).count()
    recent = db.query(Tenant).order_by(Tenant.created_at.desc()).limit(5).all()
    data = {
        "total_tenants": total_count,
        "active_tenants": active_count,
        "by_status": {status.value: count for status, count in status_counts},
        "recent_tenants": [
            {
                "id": str(tenant.id),
                "company_name": tenant.company_name,
                "status": tenant.status.value,
                "plan": tenant.plan,
                "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
            }
            for tenant in recent
        ],
    }
    return ToolResult(name=name, allowed=True, source="tenants", data=data)


TOOL_REGISTRY: dict[str, Callable[[Session, User], ToolResult]] = {
    "get_low_stock_products": get_low_stock_products,
    "get_pending_purchase_orders": get_pending_purchase_orders,
    "get_inventory_summary": get_inventory_summary,
    "get_supplier_performance": get_supplier_performance,
    "get_recent_audit_logs": get_recent_audit_logs,
    "get_warehouse_stock": get_warehouse_stock,
    "get_pending_approvals": get_pending_approvals,
    "get_platform_users": get_platform_users,
    "get_platform_tenants": get_platform_tenants,
}
