import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.enums import PurchaseOrderStatus, UserRole
from app.models.audit_log import AuditLog
from app.models.inventory_transaction import InventoryTransaction
from app.models.notification import Notification
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderAuditLog
from app.models.supplier import Supplier
from app.models.tenant import Tenant
from app.models.user import User
from app.models.warehouse import StockTransfer

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_notifications(
        self,
        user: User,
        limit: int = 20,
        include_read: bool = False,
        group: str | None = None,
        priority: str | None = None,
        search: str | None = None,
        sort: str = "newest",
    ) -> list[Notification]:
        self._sync_notifications(user)
        query = self.db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.is_deleted.is_(False)
        )
        if not include_read:
            query = query.filter(Notification.is_read.is_(False))
        if group:
            query = query.filter(Notification.group == group)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Notification.title.ilike(search_term),
                    Notification.message.ilike(search_term),
                    Notification.type.ilike(search_term),
                    Notification.group.ilike(search_term),
                )
            )
        order_column = Notification.created_at.asc() if sort == "oldest" else Notification.created_at.desc()
        notifications = query.order_by(Notification.is_read.asc(), order_column).limit(max(limit, 100)).all()
        if priority:
            notifications = [item for item in notifications if item.priority == priority]
        if sort == "priority":
            rank = {"critical": 0, "high": 1, "medium": 2, "normal": 3}
            notifications = sorted(notifications, key=lambda item: (rank.get(item.priority, 3), item.created_at), reverse=False)
        return notifications[:limit]

    def unread_count(self, user: User) -> int:
        self._sync_notifications(user)
        return int(
            self.db.query(func.count(Notification.id))
            .filter(
                Notification.user_id == user.id,
                Notification.is_read.is_(False),
                Notification.is_deleted.is_(False)
            )
            .scalar()
            or 0
        )

    def mark_read(self, user: User, notification_id: UUID | None = None) -> int:
        query = self.db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False))
        if notification_id is not None:
            query = query.filter(Notification.id == notification_id)
        now = datetime.now(UTC)
        count = 0
        for notification in query.all():
            notification.is_read = True
            notification.read_at = now
            count += 1
        self.db.flush()
        return count

    def delete_notification(self, user: User, notification_id: UUID) -> bool:
        notification = (
            self.db.query(Notification)
            .filter(Notification.user_id == user.id, Notification.id == notification_id)
            .one_or_none()
        )
        if notification:
            notification.is_deleted = True
            self.db.flush()
            return True
        return False

    def activity_feed(self, user: User, limit: int = 20) -> list[dict]:
        if user.role == UserRole.SUPER_ADMIN:
            return self._platform_activity(limit)
        if user.tenant_id is None:
            return []
        items = self._tenant_activity(user.tenant_id, limit)
        if user.role == UserRole.WAREHOUSE_STAFF and user.assigned_warehouse:
            items = [item for item in items if item.get("warehouse_location") in (None, user.assigned_warehouse)]
        if user.role == UserRole.WAREHOUSE_STAFF:
            items = [item for item in items if item["group"] in {"inventory", "warehouse"}]
        if user.role == UserRole.INVENTORY_MANAGER:
            items = [item for item in items if item["group"] in {"inventory", "warehouse"}]
        return sorted(items, key=lambda item: item["created_at"], reverse=True)[:limit]

    def _sync_notifications(self, user: User) -> None:
        try:
            payloads = self._notification_payloads(user)
            for payload in payloads:
                existing = (
                    self.db.query(Notification)
                    .filter(Notification.user_id == user.id, Notification.dedupe_key == payload["dedupe_key"])
                    .one_or_none()
                )
                if existing is None:
                    self.db.add(Notification(user_id=user.id, tenant_id=user.tenant_id, **payload))
            self.db.flush()
        except Exception:
            logger.exception("Notification sync failed for user %s", user.id)
            self.db.rollback()

    def _notification_payloads(self, user: User) -> list[dict]:
        user_role = self._role(user)
        if user_role == UserRole.SUPER_ADMIN:
            active_tenants = int(self.db.query(func.count(Tenant.id)).scalar() or 0)
            recent_users = self.db.query(User).order_by(User.created_at.desc()).limit(3).all()
            recent_tenants = self.db.query(Tenant).order_by(Tenant.created_at.desc()).limit(3).all()
            return [
                {
                    "type": "platform_activity",
                    "group": "platform",
                    "title": "Platform activity summary",
                    "message": f"{active_tenants} tenants are present on the platform.",
                    "entity_type": None,
                    "entity_id": None,
                    "dedupe_key": f"platform-summary-{active_tenants}",
                },
                *[
                    {
                        "type": "new_tenant_registered",
                        "group": "platform",
                        "title": "New tenant registered",
                        "message": f"{tenant.company_name} joined the platform.",
                        "entity_type": "tenant",
                        "entity_id": tenant.id,
                        "dedupe_key": f"tenant-created-{tenant.id}",
                    }
                    for tenant in recent_tenants
                ],
                *[
                    {
                        "type": "new_user_added",
                        "group": "users",
                        "title": "New user added",
                        "message": f"{recent_user.name} joined as {self._role_label(recent_user)}.",
                        "entity_type": "user",
                        "entity_id": recent_user.id,
                        "dedupe_key": f"user-created-{recent_user.id}",
                    }
                    for recent_user in recent_users
                ],
            ]

        if user.tenant_id is None:
            return []

        payloads: list[dict] = []
        low_stock = (
            self.db.query(Product)
            .filter(Product.tenant_id == user.tenant_id, Product.quantity <= 10)
            .order_by(Product.quantity.asc(), Product.product_name.asc())
            .limit(5)
            .all()
        )
        for product in low_stock:
            if user_role == UserRole.WAREHOUSE_STAFF and product.warehouse_location != user.assigned_warehouse:
                continue
            notification_type = "out_of_stock" if product.quantity <= 0 else "low_stock"
            if user_role in {UserRole.RETAILER_ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF}:
                payloads.append(
                    {
                        "type": notification_type,
                        "group": "inventory",
                        "title": "Out of stock" if notification_type == "out_of_stock" else "Low stock alert",
                        "message": f"{product.product_name} has {product.quantity} units remaining.",
                        "entity_type": "product",
                        "entity_id": product.id,
                        "dedupe_key": f"{notification_type}-{product.id}-{product.quantity}",
                    }
                )
            if user_role in {UserRole.RETAILER_ADMIN, UserRole.PROCUREMENT_MANAGER}:
                payloads.append(
                    {
                        "type": "reorder_recommended",
                        "group": "restock",
                        "title": "Reorder recommended",
                        "message": f"Restocking recommended for {product.product_name}.",
                        "entity_type": "product",
                        "entity_id": product.id,
                        "dedupe_key": f"reorder-{product.id}-{product.quantity}",
                    }
                )

        if user_role in {UserRole.RETAILER_ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF, UserRole.AUDITOR}:
            for tx in self._recent_transactions(user):
                product_name = tx.product.product_name if tx.product else "Product"
                payloads.append(
                    {
                        "type": "stock_adjustment" if tx.transaction_type == "ADJUSTMENT" else "inventory_movement",
                        "group": "audit" if user_role == UserRole.AUDITOR else "inventory",
                        "title": tx.transaction_type.replace("_", " ").title(),
                        "message": f"{product_name}: {tx.quantity} units.",
                        "entity_type": "inventory_transaction",
                        "entity_id": tx.id,
                        "dedupe_key": f"inventory-tx-{tx.id}",
                    }
                )

        if user_role in {UserRole.RETAILER_ADMIN, UserRole.PROCUREMENT_MANAGER}:
            payloads.extend(self._purchase_order_notifications(user.tenant_id))
            payloads.extend(self._supplier_notifications(user.tenant_id))
        if user_role in {UserRole.RETAILER_ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF}:
            payloads.extend(self._warehouse_notifications(user.tenant_id, user.assigned_warehouse if user_role == UserRole.WAREHOUSE_STAFF else None))
        if user_role == UserRole.RETAILER_ADMIN:
            payloads.extend(self._new_user_notifications(user.tenant_id))
            payloads.extend(self._ai_notifications(user.tenant_id))
        if user_role == UserRole.AUDITOR:
            payloads.extend(self._audit_notifications(user.tenant_id))
        return payloads

    def _recent_transactions(self, user: User) -> list[InventoryTransaction]:
        query = (
            self.db.query(InventoryTransaction)
            .join(Product, Product.id == InventoryTransaction.product_id)
            .filter(InventoryTransaction.tenant_id == user.tenant_id)
            .order_by(InventoryTransaction.created_at.desc())
            .limit(5)
        )
        if self._role(user) == UserRole.WAREHOUSE_STAFF:
            query = query.filter(Product.warehouse_location == user.assigned_warehouse)
        return query.all()

    def _purchase_order_notifications(self, tenant_id: UUID) -> list[dict]:
        cutoff = datetime.now(UTC).date()
        orders = (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.status.in_([PurchaseOrderStatus.APPROVED.value, PurchaseOrderStatus.PENDING.value]),
            )
            .order_by(PurchaseOrder.updated_at.desc())
            .limit(5)
            .all()
        )
        payloads = []
        for order in orders:
            delayed = order.expected_delivery_date is not None and order.expected_delivery_date < cutoff and order.status == PurchaseOrderStatus.APPROVED.value
            payloads.append(
                {
                    "type": "shipment_delayed" if delayed else "po_approved" if order.status == PurchaseOrderStatus.APPROVED.value else "po_pending",
                    "group": "procurement",
                    "title": "Shipment delayed" if delayed else "Purchase order approved" if order.status == PurchaseOrderStatus.APPROVED.value else "Purchase order pending",
                    "message": f"{order.po_number} is {order.status.replace('_', ' ')}.",
                    "entity_type": "purchase_order",
                    "entity_id": order.id,
                    "dedupe_key": f"po-{order.status}-{order.id}",
                }
            )
        return payloads

    def _supplier_notifications(self, tenant_id: UUID) -> list[dict]:
        suppliers = (
            self.db.query(Supplier)
            .filter(Supplier.tenant_id == tenant_id)
            .order_by(Supplier.updated_at.desc())
            .limit(5)
            .all()
        )
        payloads = []
        for supplier in suppliers:
            inactive = supplier.status == "inactive"
            payloads.append(
                {
                    "type": "supplier_inactive" if inactive else "supplier_updated",
                    "group": "suppliers",
                    "title": "Supplier inactive" if inactive else "Supplier profile updated",
                    "message": f"{supplier.name} is currently {supplier.status}.",
                    "entity_type": "supplier",
                    "entity_id": supplier.id,
                    "dedupe_key": f"supplier-{supplier.status}-{supplier.id}-{supplier.updated_at.isoformat()}",
                }
            )
        delayed_suppliers = (
            self.db.query(Supplier)
            .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
            .filter(
                Supplier.tenant_id == tenant_id,
                PurchaseOrder.expected_delivery_date < datetime.now(UTC).date(),
                PurchaseOrder.status == PurchaseOrderStatus.APPROVED.value,
            )
            .order_by(PurchaseOrder.expected_delivery_date.asc())
            .limit(3)
            .all()
        )
        for supplier in delayed_suppliers:
            payloads.append(
                {
                    "type": "supplier_performance_drop",
                    "group": "suppliers",
                    "title": "Supplier performance alert",
                    "message": f"{supplier.name} has delayed approved purchase orders.",
                    "entity_type": "supplier",
                    "entity_id": supplier.id,
                    "dedupe_key": f"supplier-performance-{supplier.id}",
                }
            )
        return payloads

    def _warehouse_notifications(self, tenant_id: UUID, assigned_warehouse: str | None = None) -> list[dict]:
        query = self.db.query(StockTransfer).filter(StockTransfer.tenant_id == tenant_id).order_by(StockTransfer.updated_at.desc()).limit(5)
        transfers = query.all()
        payloads = []
        for transfer in transfers:
            destination_name = transfer.destination_warehouse.name if transfer.destination_warehouse else None
            source_name = transfer.source_warehouse.name if transfer.source_warehouse else None
            product_name = transfer.product.product_name if transfer.product else "product"
            if assigned_warehouse and destination_name != assigned_warehouse and source_name != assigned_warehouse:
                continue
            payloads.append(
                {
                    "type": "transfer_approved" if transfer.status == "approved" else "transfer_pending",
                    "group": "warehouse",
                    "title": "Transfer approved" if transfer.status == "approved" else "Warehouse transfer update",
                    "message": f"{transfer.quantity} units of {product_name}: {transfer.status}.",
                    "entity_type": "stock_transfer",
                    "entity_id": transfer.id,
                    "dedupe_key": f"transfer-{transfer.status}-{transfer.id}",
                }
            )
        return payloads

    def _new_user_notifications(self, tenant_id: UUID) -> list[dict]:
        return [
            {
                "type": "new_user_added",
                "group": "users",
                "title": "New user added",
                "message": f"{user.name} joined as {self._role_label(user)}.",
                "entity_type": "user",
                "entity_id": user.id,
                "dedupe_key": f"tenant-user-{user.id}",
            }
            for user in self.db.query(User).filter(User.tenant_id == tenant_id).order_by(User.created_at.desc()).limit(3).all()
        ]

    def _audit_notifications(self, tenant_id: UUID) -> list[dict]:
        return [
            {
                "type": "audit_event",
                "group": "audit",
                "title": "Audit event recorded",
                "message": log.message or f"{log.module} {log.action} activity was recorded.",
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "dedupe_key": f"audit-{log.id}",
            }
            for log in (
                self.db.query(AuditLog)
                .filter(AuditLog.tenant_id == tenant_id)
                .order_by(AuditLog.created_at.desc())
                .limit(8)
                .all()
            )
        ]

    def _ai_notifications(self, tenant_id: UUID) -> list[dict]:
        low_stock_count = int(
            self.db.query(func.count(Product.id))
            .filter(Product.tenant_id == tenant_id, Product.quantity <= 10)
            .scalar()
            or 0
        )
        overstocked_count = int(
            self.db.query(func.count(Product.id))
            .filter(Product.tenant_id == tenant_id, Product.quantity >= 100)
            .scalar()
            or 0
        )
        payloads: list[dict] = []
        if low_stock_count:
            payloads.append(
                {
                    "type": "stockout_risk",
                    "group": "ai",
                    "title": "AI stockout risk",
                    "message": f"{low_stock_count} products may need restocking within the next 7 days.",
                    "entity_type": None,
                    "entity_id": None,
                    "dedupe_key": f"ai-stockout-risk-{low_stock_count}",
                }
            )
        if overstocked_count:
            payloads.append(
                {
                    "type": "dead_stock_detected",
                    "group": "ai",
                    "title": "AI inventory recommendation",
                    "message": f"{overstocked_count} products may be overstocked or slow moving.",
                    "entity_type": None,
                    "entity_id": None,
                    "dedupe_key": f"ai-dead-stock-{overstocked_count}",
                }
            )
        return payloads

    def _tenant_activity(self, tenant_id: UUID, limit: int) -> list[dict]:
        items: list[dict] = []
        transactions = (
            self.db.query(InventoryTransaction)
            .join(Product, Product.id == InventoryTransaction.product_id)
            .filter(InventoryTransaction.tenant_id == tenant_id)
            .order_by(InventoryTransaction.created_at.desc())
            .limit(limit)
            .all()
        )
        for tx in transactions:
            product_name = tx.product.product_name if tx.product else "Product"
            items.append({
                "id": f"tx-{tx.id}",
                "type": tx.transaction_type.lower(),
                "group": "inventory",
                "title": tx.transaction_type.replace("_", " ").title(),
                "message": f"{product_name}: {tx.quantity} units.",
                "created_at": tx.created_at,
                "warehouse_location": tx.product.warehouse_location if tx.product else None,
            })
        for log in (
            self.db.query(PurchaseOrderAuditLog)
            .filter(PurchaseOrderAuditLog.tenant_id == tenant_id)
            .order_by(PurchaseOrderAuditLog.created_at.desc())
            .limit(limit)
            .all()
        ):
            items.append({
                "id": f"po-log-{log.id}",
                "type": f"po_{log.action}",
                "group": "procurement",
                "title": f"PO {log.action}",
                "message": log.details or "Purchase order activity recorded.",
                "created_at": log.created_at,
                "warehouse_location": None,
            })
        return items

    def _platform_activity(self, limit: int) -> list[dict]:
        return [
            {
                "id": f"user-{user.id}",
                "type": "new_user_added",
                "group": "platform",
                "title": "User activity",
                "message": f"{user.name} joined {user.tenant.company_name if user.tenant else 'platform'} as {self._role_label(user)}.",
                "created_at": user.created_at,
            }
            for user in self.db.query(User).order_by(User.created_at.desc()).limit(limit).all()
        ]

    def _role(self, user: User) -> UserRole | None:
        if isinstance(user.role, UserRole):
            return user.role
        try:
            return UserRole(str(user.role))
        except ValueError:
            return None

    def _role_label(self, user: User) -> str:
        role = self._role(user)
        if role is not None:
            return role.value.replace("_", " ")
        return str(user.role).replace("_", " ")
