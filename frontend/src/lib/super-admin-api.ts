import { api, type ApiEnvelope } from './api';

export type TenantItem = {
  id: string;
  company_name: string;
  contact_email: string;
  status: string;
  plan: string;
  max_users: number;
  max_warehouses: number;
  max_products: number;
  feature_barcode: boolean;
  feature_warehouses: boolean;
  feature_procurement: boolean;
  feature_analytics: boolean;
  feature_exports: boolean;
  feature_audit_logs: boolean;
  created_at: string;
  updated_at: string;
  users_count: number;
  products_count: number;
  warehouses_count: number;
  last_activity: string;
  onboarding_percentage: number;
};

export type PlatformAnalyticsData = {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_products: number;
  total_warehouses: number;
  total_transactions: number;
  monthly_movements: number;
  active_ratio: number;
  avg_onboarding_completion: number;
  tenant_growth: { name: string; tenants: number }[];
  onboarding_funnel: {
    imported_csv: number;
    created_warehouse: number;
    added_products: number;
    invited_users: number;
    completed: number;
  };
  activity_trend: { name: string; transactions: number }[];
};

export type SystemHealthData = {
  database: {
    status: string;
    latency_ms: number;
    size_mb: number;
  };
  api_server: {
    status: string;
    uptime_percent: number;
    version: string;
  };
  failures: {
    failed_logins_30d: number;
    failed_jobs_30d: number;
    unresolved_alerts: number;
  };
  storage: {
    allocated_gb: number;
    used_gb: number;
    utilization_percent: number;
  };
};

export type AuditLogItem = {
  id: string;
  tenant_id: string | null;
  tenant_name: string;
  actor_id: string | null;
  actor_name: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  message: string | null;
  created_at: string;
  severity: string;
};

export type SupportIssuesData = {
  stuck_onboarding_tenants: {
    tenant_id: string;
    company_name: string;
    contact_email: string;
    onboarding_percentage: number;
    last_activity: string;
  }[];
  failed_csv_imports_count: number;
  reported_issues: {
    id: string;
    company_name: string;
    contact_email: string;
    category: string;
    description: string;
    status: string;
    created_at: string;
  }[];
  summary: {
    unresolved_count: number;
    stuck_count: number;
    failed_imports: number;
  };
};

export type PermissionMatrixData = {
  matrix: Record<string, string[]>;
  templates: { id: string; name: string; roles_count: number }[];
};

// API calls
export async function getTenants(search?: string, status?: string) {
  const response = await api.get<ApiEnvelope<TenantItem[]>>('/super-admin/tenants', {
    params: { search, status },
  });
  return response.data.data ?? [];
}

export async function getTenant(tenantId: string) {
  const response = await api.get<ApiEnvelope<TenantItem>>(`/super-admin/tenants/${tenantId}`);
  return response.data.data;
}

export async function updateTenantStatus(tenantId: string, statusVal: string, rejectionReason?: string) {
  const response = await api.post<ApiEnvelope<TenantItem>>(`/super-admin/tenants/${tenantId}/status`, {
    status: statusVal,
    rejection_reason: rejectionReason,
  });
  return response.data.data;
}

export async function deleteTenant(tenantId: string) {
  const response = await api.delete<ApiEnvelope<void>>(`/super-admin/tenants/${tenantId}`);
  return response.data;
}

export async function resolveSupportRequest(requestId: string, status: string) {
  const response = await api.post<ApiEnvelope<void>>(`/super-admin/support-requests/${requestId}/resolve`, { status });
  return response.data;
}

export async function deleteSupportRequest(requestId: string) {
  const response = await api.delete<ApiEnvelope<void>>(`/super-admin/support-requests/${requestId}`);
  return response.data;
}



export async function updateTenantPlan(tenantId: string, planData: {
  plan: string;
  max_users: number;
  max_warehouses: number;
  max_products: number;
}) {
  const response = await api.post<ApiEnvelope<TenantItem>>(`/super-admin/tenants/${tenantId}/plan`, planData);
  return response.data.data;
}

export async function updateTenantFeatures(tenantId: string, featuresData: {
  feature_barcode: boolean;
  feature_warehouses: boolean;
  feature_procurement: boolean;
  feature_analytics: boolean;
  feature_exports: boolean;
  feature_audit_logs: boolean;
}) {
  const response = await api.post<ApiEnvelope<TenantItem>>(`/super-admin/tenants/${tenantId}/features`, featuresData);
  return response.data.data;
}

export async function getPlatformAnalytics() {
  const response = await api.get<ApiEnvelope<PlatformAnalyticsData>>('/super-admin/analytics');
  return response.data.data;
}

export async function getSystemHealth() {
  const response = await api.get<ApiEnvelope<SystemHealthData>>('/super-admin/health');
  return response.data.data;
}

export async function getAuditLogs(params?: {
  tenant_id?: string;
  actor_id?: string;
  module?: string;
  action?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiEnvelope<AuditLogItem[]>>('/super-admin/audit-logs', { params });
  return response.data.data ?? [];
}

export async function getSupportIssues() {
  const response = await api.get<ApiEnvelope<SupportIssuesData>>('/super-admin/support-issues');
  return response.data.data;
}

export async function getRolePermissions() {
  const response = await api.get<ApiEnvelope<PermissionMatrixData>>('/super-admin/permissions');
  return response.data.data;
}

export type SubscriptionPlanItem = {
  plan_code: string;
  name: string;
  price: number;
  max_users: number;
  max_warehouses: number;
  max_products: number;
  feature_barcode: boolean;
  feature_warehouses: boolean;
  feature_procurement: boolean;
  feature_analytics: boolean;
  feature_exports: boolean;
  feature_audit_logs: boolean;
  description: string | null;
  storage_limit_gb: number;
};

export async function getPlans() {
  const response = await api.get<ApiEnvelope<SubscriptionPlanItem[]>>('/super-admin/plans');
  return response.data.data ?? [];
}

export async function updatePlan(planCode: string, planData: Omit<SubscriptionPlanItem, 'plan_code'>) {
  const response = await api.put<ApiEnvelope<SubscriptionPlanItem>>(`/super-admin/plans/${planCode}`, planData);
  return response.data.data;
}
