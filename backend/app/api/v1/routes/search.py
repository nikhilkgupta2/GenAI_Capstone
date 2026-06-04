from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, ensure_tenant_access
from app.models.user import User
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.warehouse import Warehouse
from app.models.purchase_order import PurchaseOrder
from app.models.inventory_transaction import InventoryTransaction
from app.schemas.search import SearchResponse, SearchResultItem
from app.api.deps import require_tenant_roles
from app.core.enums import UserRole

router = APIRouter(prefix="/search", tags=["search"])
DbSession = Annotated[Session, Depends(get_db)]
from app.api.deps import get_current_user

@router.get("", response_model=SearchResponse)
def global_search(
    db: DbSession,
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    Search across multiple entities with tenant isolation.
    """
    results: List[SearchResultItem] = []
    tenant_id = current_user.tenant_id
    search_term = f"%{q}%"

    # 1. Search Products
    products = db.query(Product).filter(
        Product.tenant_id == tenant_id,
        or_(
            Product.product_name.ilike(search_term),
            Product.sku.ilike(search_term),
            Product.category.ilike(search_term)
        )
    ).limit(limit).all()
    for p in products:
        results.append(SearchResultItem(
            id=p.id,
            type="product",
            title=p.product_name,
            subtitle=f"SKU: {p.sku} | Category: {p.category}",
            link=f"/products",
            metadata={"sku": p.sku, "category": p.category}
        ))

    # 2. Search Suppliers
    suppliers = db.query(Supplier).filter(
        Supplier.tenant_id == tenant_id,
        or_(
            Supplier.name.ilike(search_term),
            Supplier.contact_name.ilike(search_term)
        )
    ).limit(limit).all()
    for s in suppliers:
        results.append(SearchResultItem(
            id=s.id,
            type="supplier",
            title=s.name,
            subtitle=f"Contact: {s.contact_name or 'N/A'}",
            link=f"/suppliers",
            metadata={"contact": s.contact_name}
        ))

    # 3. Search Warehouses
    warehouses = db.query(Warehouse).filter(
        Warehouse.tenant_id == tenant_id,
        or_(
            Warehouse.warehouse_name.ilike(search_term),
            Warehouse.location.ilike(search_term)
        )
    ).limit(limit).all()
    for w in warehouses:
        results.append(SearchResultItem(
            id=w.id,
            type="warehouse",
            title=w.warehouse_name,
            subtitle=f"Location: {w.location}",
            link=f"/warehouses",
            metadata={"location": w.location}
        ))

    # 4. Search POs
    pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.tenant_id == tenant_id,
        or_(
            PurchaseOrder.po_number.ilike(search_term),
            PurchaseOrder.status.ilike(search_term)
        )
    ).limit(limit).all()
    for po in pos:
        results.append(SearchResultItem(
            id=po.id,
            type="po",
            title=f"Order {po.po_number}",
            subtitle=f"Status: {po.status}",
            link=f"/procurement",
            metadata={"po_number": po.po_number}
        ))

    return SearchResponse(results=results[:limit], total=len(results))

@router.get("/suggestions", response_model=SearchResponse)
def search_suggestions(
    db: DbSession,
    q: str = Query(..., min_length=1),
    limit: int = Query(6, ge=1, le=20),
    current_user: User = Depends(get_current_user)
):
    """
    Fast suggestions across entities.
    """
    results: List[SearchResultItem] = []
    tenant_id = current_user.tenant_id
    search_term = f"%{q}%"

    # Quick scatter search
    # Products
    products = db.query(Product).filter(
        Product.tenant_id == tenant_id,
        Product.product_name.ilike(search_term)
    ).limit(3).all()
    for p in products:
        results.append(SearchResultItem(
            id=p.id,
            type="product",
            title=p.product_name,
            subtitle="Product",
            link=f"/products"
        ))

    # Suppliers
    suppliers = db.query(Supplier).filter(
        Supplier.tenant_id == tenant_id,
        Supplier.name.ilike(search_term)
    ).limit(2).all()
    for s in suppliers:
        results.append(SearchResultItem(
            id=s.id,
            type="supplier",
            title=s.name,
            subtitle="Supplier",
            link=f"/suppliers"
        ))

    # Warehouses
    warehouses = db.query(Warehouse).filter(
        Warehouse.tenant_id == tenant_id,
        Warehouse.warehouse_name.ilike(search_term)
    ).limit(2).all()
    for w in warehouses:
        results.append(SearchResultItem(
            id=w.id,
            type="warehouse",
            title=w.warehouse_name,
            subtitle="Warehouse",
            link=f"/warehouses"
        ))

    return SearchResponse(results=results[:limit], total=len(results))
