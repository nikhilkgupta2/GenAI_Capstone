from __future__ import annotations

import re

from fastapi import HTTPException, status

INJECTION_PATTERNS = [
    r"ignore (all |previous |above )?instructions",
    r"system prompt",
    r"developer message",
    r"you are now",
    r"act as",
    r"jailbreak",
    r"\bDAN\b",
    r"drop table",
    r"delete from",
    r"insert into",
    r"update .+ set",
]


def sanitize_message(message: str) -> str:
    clean = message.strip()[:1000]
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, clean, re.IGNORECASE):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsafe prompt detected.")
    return clean


def route_tools(message: str) -> list[str]:
    text = message.lower()
    routes: list[str] = []
    if any(term in text for term in ["low stock", "reorder", "below stock", "running out"]):
        routes.append("get_low_stock_products")
    if any(term in text for term in ["pending purchase", "pending po", "open purchase order", "purchase order", "supplier delays"]):
        routes.append("get_pending_purchase_orders")
    if any(term in text for term in ["inventory summary", "stock summary", "inventory overview", "summary", "reorder suggestions", "slow moving inventory", "stock movements", "replenishment suggestions"]):
        routes.append("get_inventory_summary")
    if any(term in text for term in ["supplier performance", "supplier delays", "supplier", "vendor"]):
        routes.append("get_supplier_performance")
    if any(term in text for term in ["audit", "adjustment history", "recent adjustments", "approval history"]):
        routes.append("get_recent_audit_logs")
    if any(term in text for term in ["warehouse stock", "warehouse inventory", "find sku", "sku", "warehouse", "transfer tasks"]):
        routes.append("get_warehouse_stock")
    if any(term in text for term in ["pending approvals", "approval queue", "approvals"]):
        routes.append("get_pending_approvals")
    if any(term in text for term in ["tenant", "tenants", "active tenants", "tenant count", "platform tenants"]):
        routes.append("get_platform_tenants")
    if any(term in text for term in ["users", "retailer admin", "user count", "platform users"]):
        routes.append("get_platform_users")
    if "how many" in text and not routes:
        routes.append("get_inventory_summary")
    return routes
