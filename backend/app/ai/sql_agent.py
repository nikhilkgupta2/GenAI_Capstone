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
    
    # 1. QUANTITY / TOTALS
    if any(term in text for term in [
        "quantity", "total stock", "how many", "inventory count", "stock count",
        "calculate stock", "aggregate", "volume"
    ]):
        routes.append("get_dashboard_metrics")
        routes.append("get_inventory_summary")

    # 2. HIGH STOCK
    if any(term in text for term in [
        "high stock", "overstock", "extra inventory", "maximum", "highest", 
        "top items", "bulk stock", "surplus", "excess"
    ]):
        routes.append("get_top_stock_products")
        
    # 3. LOW STOCK
    if any(term in text for term in [
        "low stock", "running out", "shortage", "almost finished", "lowest",
        "minimum", "less quantity", "out of stock", "zero quantity", "empty"
    ]):
        routes.append("get_absolute_minimum_stock")
        routes.append("get_low_stock_products")
        
    # 4. PENDING / APPROVALS
    if any(term in text for term in [
        "approval", "waiting for", "to approve", "pending", "queue"
    ]):
        routes.append("get_pending_approvals")
        routes.append("get_pending_purchase_orders")
        
    # 5. DASHBOARD / STATUS
    if any(term in text for term in [
        "dashboard", "summary", "overview", "status", "stats", "kpi", 
        "report", "how are we doing", "health", "system check"
    ]):
        routes.append("get_dashboard_metrics")
        
    # 6. PURCHASES
    if any(term in text for term in [
        "purchase", "orders", "po", "restock", "buy", "incoming", "procurement"
    ]):
        routes.append("get_pending_purchase_orders")
        
    # 7. SUPPLIERS
    if any(term in text for term in [
        "supplier", "vendor", "manufacturer", "who provides", "performance"
    ]):
        routes.append("get_supplier_performance")
        
    # 8. AUDIT / LOGS
    if any(term in text for term in [
        "audit", "adjustment history", "activity", "log", "who changed", "event"
    ]):
        routes.append("get_recent_audit_logs")
        
    # 9. WAREHOUSE / LOCATION
    if any(term in text for term in [
        "warehouse", "storage", "location", "find product", "where is", "bin"
    ]):
        routes.append("get_warehouse_stock")
        routes.append("get_inventory_summary") # Aggregated view
        
    # 10. USERS / STAFF
    if any(term in text for term in [
        "user", "staff", "admin", "team", "member", "account", "profile"
    ]):
        routes.append("get_platform_users")
        
    # 11. TRANSACTIONS / MOVEMENT
    if any(term in text for term in [
        "transaction", "movement", "shipped", "received", "tx", "history", 
        "stock flow", "incoming vs outgoing"
    ]):
        routes.append("get_inventory_transactions")
        
    # 12. CASE / SUPPORT
    if any(term in text for term in [
        "case", "support", "ticket", "issue", "complaint", "help", "customer talk"
    ]):
        routes.append("get_support_cases")
        
    return list(set(routes)) # Remove duplicates
