from __future__ import annotations

from app.core.enums import UserRole

ROLE_PERMISSIONS: dict[UserRole, set[str]] = {
    UserRole.SUPER_ADMIN: {
        "tenants",
        "platform_analytics",
        "users",
        "billing",
        "system_health",
        "products",
        "inventory",
        "warehouses",
        "suppliers",
        "purchase_orders",
        "approvals",
        "audit_logs",
    },
    UserRole.RETAILER_ADMIN: {
        "products",
        "inventory",
        "warehouses",
        "suppliers",
        "purchase_orders",
        "approvals",
        "audit_logs",
    },
    UserRole.INVENTORY_MANAGER: {"products", "inventory", "warehouses"},
    UserRole.WAREHOUSE_STAFF: {"products", "inventory", "warehouses"},
    UserRole.AUDITOR: {"audit_logs", "inventory_transactions"},
    UserRole.PROCUREMENT_MANAGER: {"suppliers", "purchase_orders", "inventory"},
}

TOOL_PERMISSIONS: dict[str, set[str]] = {
    "get_low_stock_products": {"products", "inventory"},
    "get_pending_purchase_orders": {"purchase_orders"},
    "get_inventory_summary": {"inventory"},
    "get_supplier_performance": {"suppliers", "purchase_orders"},
    "get_recent_audit_logs": {"audit_logs"},
    "get_warehouse_stock": {"warehouses", "inventory"},
    "get_pending_approvals": {"approvals"},
    "get_platform_users": {"users", "platform_analytics"},
    "get_platform_tenants": {"tenants", "platform_analytics"},
}


def permissions_for_role(role: UserRole) -> set[str]:
    return ROLE_PERMISSIONS.get(role, set())


def can_use_tool(role: UserRole, tool_name: str) -> bool:
    required = TOOL_PERMISSIONS.get(tool_name, set())
    return bool(required & permissions_for_role(role))
