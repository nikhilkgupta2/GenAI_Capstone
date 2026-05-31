from uuid import UUID

from sqlalchemy.orm import Session

from app.models.tenant import Tenant


class TenantRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_contact_email(self, email: str) -> Tenant | None:
        return self.db.query(Tenant).filter(Tenant.contact_email == email).one_or_none()

    def get_by_id(self, tenant_id: UUID) -> Tenant | None:
        return self.db.query(Tenant).filter(Tenant.id == tenant_id).one_or_none()

    def create(self, *, company_name: str, contact_email: str) -> Tenant:
        from app.models.subscription_plan import SubscriptionPlan
        from app.core.enums import TenantStatus
        
        tenant = Tenant(company_name=company_name, contact_email=contact_email, status=TenantStatus.PENDING)
        
        # Load free plan defaults from DB if exists
        free_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.plan_code == "free").first()
        if free_plan:
            tenant.plan = "free"
            tenant.max_users = free_plan.max_users
            tenant.max_warehouses = free_plan.max_warehouses
            tenant.max_products = free_plan.max_products
            tenant.feature_barcode = free_plan.feature_barcode
            tenant.feature_warehouses = free_plan.feature_warehouses
            tenant.feature_procurement = free_plan.feature_procurement
            tenant.feature_analytics = free_plan.feature_analytics
            tenant.feature_exports = free_plan.feature_exports
            tenant.feature_audit_logs = free_plan.feature_audit_logs
            
        self.db.add(tenant)
        self.db.flush()
        return tenant
