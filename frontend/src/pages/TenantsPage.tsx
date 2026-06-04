import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Eye,
  Layers,
  Search,
  ShieldCheck,
  Slash,
  UserCheck,
  Users,
  Globe,
  Plus,
  Trash2
} from 'lucide-react';
import { useDialog } from '../context/DialogContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/ui/Badge';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { Page, PageHeader, SectionHeader, Toolbar } from '../components/ui/Page';
import {
  getTenants,
  updateTenantStatus,
  updateTenantPlan,
  updateTenantFeatures,
  deleteTenant,
  type TenantItem,
} from '../lib/super-admin-api';
import { useAuthStore } from '../lib/auth-store';

function formatOnboardingColor(pct: number) {
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-blue-500';
  return 'bg-amber-500';
}

export function TenantsPage() {
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const [tempSearch, setTempSearch] = useState('');
  const [tempStatusFilter, setTempStatusFilter] = useState('');
  const selectedTenantId = useAuthStore((state) => state.selectedTenantId);
  const setSelectedTenantId = useAuthStore((state) => state.setSelectedTenantId);
  const [tempTenantId, setTempTenantId] = useState(selectedTenantId ?? '');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Modals state
  const [activePlanModal, setActivePlanModal] = useState<TenantItem | null>(null);
  const [activeFeaturesModal, setActiveFeaturesModal] = useState<TenantItem | null>(null);

  // Form states for Plan Modal
  const [planForm, setPlanForm] = useState({
    plan: 'free',
    max_users: 5,
    max_warehouses: 2,
    max_products: 100,
  });

  // Form states for Features Modal
  const [featuresForm, setFeaturesForm] = useState({
    feature_barcode: true,
    feature_warehouses: true,
    feature_procurement: true,
    feature_analytics: true,
    feature_exports: true,
    feature_audit_logs: true,
  });

  // Fetch tenants
  const { data: rawTenants = [], isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'tenants', search, statusFilter],
    queryFn: () => getTenants(search || undefined, statusFilter || undefined),
  });

  const tenants = selectedTenantId
    ? rawTenants.filter((t) => t.id === selectedTenantId)
    : rawTenants;

  const allTenantsQuery = useQuery({
    queryKey: ['super-admin', 'all-tenants-list'],
    queryFn: () => getTenants(),
  });
  const approvedTenants = (allTenantsQuery.data ?? []).filter(
    (t) => t.status === 'active' || t.status === 'suspended'
  );

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTenantStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      setNotice({ type: 'success', message: `Tenant status updated to ${data.status.toUpperCase()}.` });
    },
    onError: (error: any) => {
      setNotice({ type: 'error', message: error.response?.data?.detail || 'Failed to update tenant status.' });
    }
  });

  const planMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof planForm }) => updateTenantPlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      setNotice({ type: 'success', message: 'Tenant plan and subscription limits updated.' });
      setActivePlanModal(null);
    },
    onError: (error: any) => {
      setNotice({ type: 'error', message: error.response?.data?.detail || 'Failed to update tenant plan.' });
    }
  });

  const featuresMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof featuresForm }) => updateTenantFeatures(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      setNotice({ type: 'success', message: 'Tenant feature flags updated.' });
      setActiveFeaturesModal(null);
    },
    onError: (error: any) => {
      setNotice({ type: 'error', message: error.response?.data?.detail || 'Failed to update tenant features.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      setNotice({ type: 'success', message: 'Tenant deleted successfully.' });
    },
    onError: (error: any) => {
      setNotice({ type: 'error', message: error.response?.data?.detail || 'Failed to delete tenant. Ensure all dependent records are cleared.' });
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await dialog.confirm({
      title: 'Remove Tenant',
      description: `Are you sure you want to completely remove ${name}? This action cannot be undone and will delete all associated data.`,
      confirmLabel: 'Remove Tenant',
      cancelLabel: 'Keep Tenant',
      tone: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };


  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearch);
    setStatusFilter(tempStatusFilter);
    setSelectedTenantId(tempTenantId || null);
  };

  const handleReset = () => {
    setTempSearch('');
    setTempStatusFilter('');
    setTempTenantId('');
    setSearch('');
    setStatusFilter('');
    setSelectedTenantId(null);
  };

  const openPlanModal = (tenant: TenantItem) => {
    setActivePlanModal(tenant);
    setPlanForm({
      plan: tenant.plan,
      max_users: tenant.max_users,
      max_warehouses: tenant.max_warehouses,
      max_products: tenant.max_products,
    });
  };

  const submitPlanForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePlanModal) {
      planMutation.mutate({ id: activePlanModal.id, payload: planForm });
    }
  };

  const openFeaturesModal = (tenant: TenantItem) => {
    setActiveFeaturesModal(tenant);
    setFeaturesForm({
      feature_barcode: tenant.feature_barcode,
      feature_warehouses: tenant.feature_warehouses,
      feature_procurement: tenant.feature_procurement,
      feature_analytics: tenant.feature_analytics,
      feature_exports: tenant.feature_exports,
      feature_audit_logs: tenant.feature_audit_logs,
    });
  };

  const submitFeaturesForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeFeaturesModal) {
      featuresMutation.mutate({ id: activeFeaturesModal.id, payload: featuresForm });
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Super Admin"
        title="Tenant Control Center"
        description="Monitor tenant lifecycle, approve registrations, manage subscriptions, set resource limits, and configure feature flags."
      />

      {notice && (
        <div className={`mb-4 flex items-center justify-between rounded-md border p-3 text-sm ${notice.type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
          <span className="flex items-center gap-2">
            {notice.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {notice.message}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <Toolbar className="mb-5">
        <form onSubmit={handleApply} className="flex flex-row flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px] max-w-xs space-y-1.5 text-xs font-semibold text-slate-500">
            <span>Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 h-10"
                placeholder="Company name or email"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
              />
            </div>
          </label>

          <label className="w-48 space-y-1.5 text-xs font-semibold text-slate-500">
            <span>Workspace Focus</span>
            <select
              value={tempTenantId}
              onChange={(e) => setTempTenantId(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 font-normal text-slate-800"
            >
              <option value="">Platform Overview</option>
              {approvedTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.company_name}
                </option>
              ))}
            </select>
          </label>

          <label className="w-44 space-y-1.5 text-xs font-semibold text-slate-500">
            <span>Filter Status</span>
            <select
              value={tempStatusFilter}
              onChange={(e) => setTempStatusFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 font-normal text-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <div className="flex gap-2">
            <Button type="submit" className="h-10 px-4">
              Apply
            </Button>
            <Button
              type="button"
              className="h-10 px-4 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </form>
      </Toolbar>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <SectionHeader
          title="SaaS Tenants"
          description={`${tenants.length} tenants registered on the platform.`}
        />

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-md bg-slate-100" />
            ))}
          </div>
        ) : isError ? (
          <p className="flex items-center gap-2 p-5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> Failed to load tenants list.
          </p>
        ) : tenants.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No tenants found" description="No tenants matched the search query/status filter." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable className="min-w-full rounded-none border-x-0 border-b-0 shadow-none">
              <DataTableHeader>
                <tr>
                  <DataTableHead>Company Name</DataTableHead>
                  <DataTableHead>Subscription Plan</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>Limits (U / W / P)</DataTableHead>
                  <DataTableHead>Onboarding %</DataTableHead>
                  <DataTableHead>Usage Metrics</DataTableHead>
                  <DataTableHead>Actions</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {tenants.map((t) => {
                  let statusTone: 'amber' | 'green' | 'red' | 'slate' = 'slate';
                  if (t.status === 'active') statusTone = 'green';
                  else if (t.status === 'pending') statusTone = 'amber';
                  else if (t.status === 'rejected') statusTone = 'red';
                  else if (t.status === 'suspended') statusTone = 'red';

                  return (
                    <DataTableRow key={t.id}>
                      <DataTableCell className="max-w-[250px]">
                        <Link
                          to={`/tenants/${t.id}`}
                          className="break-words font-semibold text-slate-900 underline-offset-4 transition hover:text-slate-600 hover:underline"
                          title="Open tenant overview"
                        >
                          {t.company_name}
                        </Link>
                        <div className="text-xs text-slate-500 break-all">{t.contact_email}</div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="inline-flex rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-700">
                          {t.plan}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge tone={statusTone}>{t.status.toUpperCase()}</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs text-slate-700">
                          Users: <span className="font-medium">{t.max_users}</span>
                        </div>
                        <div className="text-xs text-slate-700">
                          WH: <span className="font-medium">{t.max_warehouses}</span>
                        </div>
                        <div className="text-xs text-slate-700">
                          Products: <span className="font-medium">{t.max_products}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${formatOnboardingColor(t.onboarding_percentage)}`}
                              style={{ width: `${t.onboarding_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{t.onboarding_percentage}%</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs text-slate-600">
                          Active Users: <span className="font-semibold">{t.users_count}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Warehouses: <span className="font-semibold">{t.warehouses_count}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Products: <span className="font-semibold">{t.products_count}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-wrap gap-2">
                          {t.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                                onClick={() => handleStatusChange(t.id, 'active')}
                              >
                                <UserCheck className="mr-1 h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500 transition"
                                onClick={() => handleStatusChange(t.id, 'rejected')}
                              >
                                <Slash className="mr-1 h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          )}

                          {t.status === 'active' && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                              onClick={() => handleStatusChange(t.id, 'suspended')}
                            >
                              Suspend
                            </button>
                          )}

                          {t.status === 'suspended' && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                              onClick={() => handleStatusChange(t.id, 'active')}
                            >
                              Reactivate
                            </button>
                          )}

                          {t.status === 'rejected' && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                              onClick={() => handleStatusChange(t.id, 'active')}
                            >
                              <UserCheck className="mr-1 h-3.5 w-3.5" /> Approve
                            </button>
                          )}

                          <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                            onClick={() => handleDelete(t.id, t.company_name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </section>

      {/* PLAN & LIMITS MODAL */}
      {activePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Update Limits for {activePlanModal.company_name}</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setActivePlanModal(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitPlanForm} className="p-5 space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Billing Level</span>
                <select
                  value={planForm.plan}
                  onChange={(e) => setPlanForm({ ...planForm, plan: e.target.value })}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="free">Free Trial</option>
                  <option value="pro">Pro Plan</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Max Users Limit</span>
                <Input
                  type="number"
                  value={planForm.max_users}
                  onChange={(e) => setPlanForm({ ...planForm, max_users: parseInt(e.target.value) || 0 })}
                />
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Max Warehouses Limit</span>
                <Input
                  type="number"
                  value={planForm.max_warehouses}
                  onChange={(e) => setPlanForm({ ...planForm, max_warehouses: parseInt(e.target.value) || 0 })}
                />
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Max Products Limit</span>
                <Input
                  type="number"
                  value={planForm.max_products}
                  onChange={(e) => setPlanForm({ ...planForm, max_products: parseInt(e.target.value) || 0 })}
                />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => setActivePlanModal(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={planMutation.isPending}>
                  {planMutation.isPending ? 'Updating...' : 'Save Plan'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* FEATURE FLAGS TOGGLE MODAL */}
      {activeFeaturesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Toggle Features for {activeFeaturesModal.company_name}</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setActiveFeaturesModal(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitFeaturesForm} className="p-5 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featuresForm.feature_barcode}
                    onChange={(e) => setFeaturesForm({ ...featuresForm, feature_barcode: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Barcode Scan Mode</span>
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featuresForm.feature_warehouses}
                    onChange={(e) => setFeaturesForm({ ...featuresForm, feature_warehouses: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Multi-Warehouse Management</span>
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featuresForm.feature_procurement}
                    onChange={(e) => setFeaturesForm({ ...featuresForm, feature_procurement: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Procurement & Purchase Orders</span>
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featuresForm.feature_analytics}
                    onChange={(e) => setFeaturesForm({ ...featuresForm, feature_analytics: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Advanced Analytics & Charts</span>
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featuresForm.feature_exports}
                    onChange={(e) => setFeaturesForm({ ...featuresForm, feature_exports: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>CSV Exports & Data Portability</span>
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featuresForm.feature_audit_logs}
                    onChange={(e) => setFeaturesForm({ ...featuresForm, feature_audit_logs: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Compliance & Audit Logs</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => setActiveFeaturesModal(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={featuresMutation.isPending}>
                  {featuresMutation.isPending ? 'Updating...' : 'Save Features'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </Page>
  );
}
