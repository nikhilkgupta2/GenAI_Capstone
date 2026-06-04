from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ai.permissions import can_use_tool
from app.ai.schemas import ToolResult
from app.core.enums import PurchaseOrderStatus
from app.models.audit_log import AuditLog, StockAdjustmentRequest
from app.models.inventory_transaction import InventoryTransaction
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.models.supplier import Supplier
from app.models.support_request import SupportRequest
from app.models.user import User
from app.models.warehouse import StockTransfer, Warehouse, WarehouseInventory


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
    total_count = query.count()
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
    message = f"Found {total_count} low stock products. Showing the top 20."
    return ToolResult(name=name, allowed=True, source="products", data=data, message=message)


def get_pending_purchase_orders(db: Session, user: User) -> ToolResult:
    name = "get_pending_purchase_orders"
    if not can_use_tool(user.role, name):
        return _denied(name, "purchase_orders")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "purchase_orders")
    query = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.status == PurchaseOrderStatus.PENDING.value)
    total_count = query.count()
    rows = query.order_by(PurchaseOrder.updated_at.desc()).limit(20).all()
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
    message = f"Found {total_count} pending purchase orders. Showing the latest 20."
    return ToolResult(name=name, allowed=True, source="purchase_orders", data=data, message=message)


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
    
    # NEW: Count unique categories
    categories = set(p.category for p in products if p.category)
    category_count = len(categories)

    data = {
        "total_products": total_products,
        "total_units": total_units,
        "low_stock_count": low_stock,
        "category_count": category_count,
        "categories": sorted(list(categories)),
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
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
    total_count = query.count()
    rows = query.order_by(AuditLog.created_at.desc()).limit(20).all()
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
    message = f"Found {total_count} total audit logs. Showing the latest 20."
    return ToolResult(name=name, allowed=True, source="audit_logs", data=data, message=message)


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
    
    from app.core.enums import UserRole
    user_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    data = {
        "total_users": db.query(User).count(),
        "by_role": {role.value: count for role, count in user_counts},
    }
    return ToolResult(name=name, allowed=True, source="users", data=data)


def get_absolute_minimum_stock(db: Session, user: User) -> ToolResult:
    name = "get_absolute_minimum_stock"
    if not can_use_tool(user.role, name):
        return _denied(name, "products")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "products")
    query = db.query(Product).filter(Product.tenant_id == tenant_id)
    query = _warehouse_filter(query, user)
    product = query.order_by(Product.quantity.asc(), Product.product_name.asc()).first()
    if not product:
        return ToolResult(name=name, allowed=True, source="products", data=[], message="No products found.")
    data = [{
        "id": str(product.id),
        "name": product.product_name,
        "sku": product.sku,
        "quantity": product.quantity,
        "category": product.category,
        "warehouse_location": product.warehouse_location,
    }]
    return ToolResult(name=name, allowed=True, source="products", data=data)


def get_top_stock_products(db: Session, user: User) -> ToolResult:
    name = "get_top_stock_products"
    if not can_use_tool(user.role, name):
        return _denied(name, "products")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "products")
    query = db.query(Product).filter(Product.tenant_id == tenant_id)
    query = _warehouse_filter(query, user)
    rows = query.order_by(Product.quantity.desc(), Product.product_name.asc()).limit(5).all()
    if not rows:
        return ToolResult(name=name, allowed=True, source="products", data=[], message="No products found.")
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


def get_dashboard_metrics(db: Session, user: User) -> ToolResult:
    name = "get_dashboard_metrics"
    if not can_use_tool(user.role, name):
        return _denied(name, "dashboard")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "dashboard")

    # Product Metrics
    products = db.query(Product).filter(Product.tenant_id == tenant_id).all()
    total_products = len(products)
    total_quantity = sum(p.quantity for p in products)
    low_stock_count = sum(1 for p in products if p.quantity <= 10)

    # Warehouse Metrics
    warehouse_count = db.query(Warehouse).filter(Warehouse.tenant_id == tenant_id).count()
    
    # Transfer Metrics (Pending Requests)
    transfer_count = db.query(StockTransfer).filter(
        StockTransfer.tenant_id == tenant_id,
        StockTransfer.status == "pending"
    ).count()

    # Approval Metrics (Pending Stock Adjustments)
    approvals_count = db.query(StockAdjustmentRequest).filter(
        StockAdjustmentRequest.tenant_id == tenant_id,
        StockAdjustmentRequest.status == "pending"
    ).count()

    # Supplier Metrics
    supplier_count = db.query(Supplier).filter(Supplier.tenant_id == tenant_id).count()

    data = {
        "total_products": total_products,
        "low_stock_products": low_stock_count,
        "total_inventory_quantity": total_quantity,
        "warehouses": warehouse_count,
        "transfer_requests": transfer_count,
        "pending_approvals": approvals_count,
        "suppliers": supplier_count,
    }
    
    return ToolResult(name=name, allowed=True, source="dashboard", data=data)


def get_inventory_transactions(db: Session, user: User) -> ToolResult:
    name = "get_inventory_transactions"
    if not can_use_tool(user.role, name):
        return _denied(name, "inventory")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "inventory")
    
    query = db.query(InventoryTransaction).filter(InventoryTransaction.tenant_id == tenant_id)
    total_count = query.count()
    rows = query.order_by(InventoryTransaction.created_at.desc()).limit(20).all()
    data = [
        {
            "id": str(tx.id),
            "product": tx.product.product_name if tx.product else "Unknown",
            "type": tx.transaction_type,
            "quantity": tx.quantity,
            "date": tx.created_at.isoformat() if tx.created_at else None,
            "notes": tx.notes
        }
        for tx in rows
    ]
    message = f"Total inventory transactions in database: {total_count}. Showing the latest 20."
    return ToolResult(name=name, allowed=True, source="inventory", data=data, message=message)


def get_platform_users(db: Session, user: User) -> ToolResult:
    name = "get_platform_users"
    if not can_use_tool(user.role, name):
        return _denied(name, "users")
    tenant_id = _ensure_tenant(user)
    if tenant_id is None:
        return _tenant_required(name, "users")
    
    query = db.query(User).filter(User.tenant_id == tenant_id)
    total_count = query.count()
    rows = query.order_by(User.name.asc()).all()
    data = [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active
        }
        for u in rows
    ]
    message = f"Found {total_count} total users in this tenant."
    return ToolResult(name=name, allowed=True, source="users", data=data, message=message)


def get_support_cases(db: Session, user: User) -> ToolResult:
    name = "get_support_cases"
    if not can_use_tool(user.role, name):
        return _denied(name, "support")
    
    # Since SupportRequest doesn't have tenant_id, we'll return requests matching the user's email
    # Or broad list if they are Admin.
    query = db.query(SupportRequest)
    if user.role.value == "retailer_admin":
         # Fallback to email domain or exact email
         query = query.filter(SupportRequest.email.like(f"%{user.email.split('@')[-1]}"))
    
    rows = query.order_by(SupportRequest.created_at.desc()).limit(10).all()
    data = [
        {
            "id": str(sr.id),
            "subject": sr.subject,
            "status": sr.status.value,
            "type": sr.request_type.value,
            "created_at": sr.created_at.isoformat() if sr.created_at else None
        }
        for sr in rows
    ]
    return ToolResult(name=name, allowed=True, source="support", data=data)


TOOL_REGISTRY: dict[str, Callable[[Session, User], ToolResult]] = {
    "get_low_stock_products": get_low_stock_products,
    "get_pending_purchase_orders": get_pending_purchase_orders,
    "get_inventory_summary": get_inventory_summary,
    "get_supplier_performance": get_supplier_performance,
    "get_recent_audit_logs": get_recent_audit_logs,
    "get_warehouse_stock": get_warehouse_stock,
    "get_pending_approvals": get_pending_approvals,
    "get_platform_users": get_platform_users,
    "get_absolute_minimum_stock": get_absolute_minimum_stock,
    "get_top_stock_products": get_top_stock_products,
    "get_dashboard_metrics": get_dashboard_metrics,
    "get_support_cases": get_support_cases,
    "get_inventory_transactions": get_inventory_transactions,
}
