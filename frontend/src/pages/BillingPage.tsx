import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CreditCard,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Edit2,
  X
} from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { getTenants, getPlans, updatePlan, type SubscriptionPlanItem } from '../lib/super-admin-api';
import { useAuthStore } from '../lib/auth-store';

export function BillingPage() {
  const queryClient = useQueryClient();
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [editForm, setEditForm] = useState<Omit<SubscriptionPlanItem, 'plan_code'>>({
    name: '',
    price: 0,
    max_users: 0,
    max_warehouses: 0,
    max_products: 0,
    feature_barcode: false,
    feature_warehouses: false,
    feature_procurement: false,
    feature_analytics: false,
    feature_exports: false,
    feature_audit_logs: false,
    description: '',
    storage_limit_gb: 0,
  });

  const { data: rawTenants = [], isLoading: tenantsLoading, isError: tenantsError } = useQuery({
    queryKey: ['super-admin', 'billing-tenants'],
    queryFn: () => getTenants(),
  });

  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: ['super-admin', 'plans'],
    queryFn: getPlans,
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ planCode, planData }: { planCode: string; planData: Omit<SubscriptionPlanItem, 'plan_code'> }) =>
      updatePlan(planCode, planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'billing-tenants'] });
      setEditingPlan(null);
    },
  });

  const selectedTenantId = useAuthStore((state) => state.selectedTenantId);
  const tenants = selectedTenantId
    ? rawTenants.filter((t) => t.id === selectedTenantId)
    : rawTenants;

  if (tenantsLoading || plansLoading) {
    return (
      <Page>
        <LoadingState label="Loading subscription details..." />
      </Page>
    );
  }

  if (tenantsError || plansError) {
    return (
      <Page>
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> Subscription pricing plans and details could not be loaded.
        </p>
      </Page>
    );
  }

  // Aggregate stats
  const totalMRR = tenants.reduce((total, t) => {
    const matchedPlan = plans.find((p) => p.plan_code === t.plan);
    return total + (matchedPlan?.price ?? 0);
  }, 0);

  const planStats = tenants.reduce(
    (acc, t) => {
      acc[t.plan] = (acc[t.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filteredTenants = selectedPlanFilter
    ? tenants.filter((t) => t.plan === selectedPlanFilter)
    : tenants;

  const handleEditClick = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      price: plan.price,
      max_users: plan.max_users,
      max_warehouses: plan.max_warehouses,
      max_products: plan.max_products,
      feature_barcode: plan.feature_barcode,
      feature_warehouses: plan.feature_warehouses,
      feature_procurement: plan.feature_procurement,
      feature_analytics: plan.feature_analytics,
      feature_exports: plan.feature_exports,
      feature_audit_logs: plan.feature_audit_logs,
      description: plan.description ?? '',
      storage_limit_gb: plan.storage_limit_gb,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    updatePlanMutation.mutate({
      planCode: editingPlan.plan_code,
      planData: editForm,
    });
  };

  const hasAnalytics = (plan: SubscriptionPlanItem) => plan.feature_analytics || plan.plan_code === 'free';
  const hasBarcode = (plan: SubscriptionPlanItem) => plan.feature_barcode || plan.plan_code === 'free';
  const hasAuditLogs = (plan: SubscriptionPlanItem) => plan.feature_audit_logs || plan.plan_code === 'free';
  const hasAiInsights = (plan: SubscriptionPlanItem) => plan.plan_code === 'pro' || plan.plan_code === 'enterprise';

  return (
    <Page>
      <PageHeader
        eyebrow="Platform Subscriptions"
        title="Billing & Monetization"
        description="Configure pricing plans, view platform Monthly Recurring Revenue (MRR), track SaaS quotas, and update subscription billing tiers."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* MRR Card */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">Estimated MRR</p>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950">${totalMRR.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Based on standard tier pricing</p>
        </section>

        {/* Dynamic Plan Stat Cards */}
        {plans.map((plan) => {
          const count = planStats[plan.plan_code] ?? 0;
          const isSelected = selectedPlanFilter === plan.plan_code;
          return (
            <section
              key={plan.plan_code}
              className={`cursor-pointer rounded-lg border p-5 shadow-sm transition hover:border-slate-400 ${
                isSelected ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-white'
              }`}
              onClick={() => setSelectedPlanFilter(isSelected ? '' : plan.plan_code)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{plan.name} Tier</p>
                <Layers className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-950">{count}</p>
              <p className="mt-1 text-xs text-slate-500">Click to filter (${plan.price} / mo)</p>
            </section>
          );
        })}
      </div>

      {/* Pricing Configuration Catalog */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-950 mb-4">Pricing Configuration Catalog</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.plan_code}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-sm ${
                plan.plan_code === 'pro' ? 'border-indigo-600 shadow-indigo-600/5' : 'border-slate-200'
              }`}
            >
              {plan.plan_code === 'pro' && (
                <div className="absolute right-0 top-0 bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}
              <div>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {plan.plan_code.toUpperCase()} Pack
                </span>
                <div className="flex items-start justify-between mt-2">
                  <h3 className="text-2xl font-semibold text-slate-900">{plan.name}</h3>
                  <button
                    type="button"
                    onClick={() => handleEditClick(plan)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
                    title="Edit Plan Limits"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-500">{plan.description || 'No description provided.'}</p>
                <div className="my-5 border-t border-slate-100 pt-5">
                  <p className="text-4xl font-extrabold tracking-tight text-slate-900">${plan.price}</p>
                  <p className="mt-1 text-sm text-slate-500">/ month</p>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    ✓ Max {plan.max_users === -1 ? 'Unlimited' : `${plan.max_users} active`} user{plan.max_users === 1 ? '' : 's'}
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ {plan.max_warehouses === -1 ? 'Unlimited' : `${plan.max_warehouses}`} warehouse{plan.max_warehouses === 1 ? '' : 's'} maximum
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Up to {plan.max_products === -1 ? 'Unlimited' : plan.max_products.toLocaleString()} catalog SKU{plan.max_products === 1 ? '' : 's'}
                  </li>
                  <li className={`flex items-center gap-2 ${hasAnalytics(plan) ? '' : 'text-slate-400'}`}>
                    {hasAnalytics(plan) ? '✓' : '✗'} Analytics & charts {hasAnalytics(plan) ? 'enabled' : 'disabled'}
                  </li>
                  <li className={`flex items-center gap-2 ${hasBarcode(plan) ? '' : 'text-slate-400'}`}>
                    {hasBarcode(plan) ? '✓' : '✗'} Barcode scanner module {hasBarcode(plan) ? 'enabled' : 'disabled'}
                  </li>
                  <li className={`flex items-center gap-2 ${hasAuditLogs(plan) ? '' : 'text-slate-400'}`}>
                    {hasAuditLogs(plan) ? '✓' : '✗'} Audit logs {hasAuditLogs(plan) ? 'enabled' : 'disabled'}
                  </li>
                  <li className={`flex items-center gap-2 ${hasAiInsights(plan) ? '' : 'text-slate-400'}`}>
                    {hasAiInsights(plan) ? '✓' : '✗'} AI insights {hasAiInsights(plan) ? 'enabled' : 'disabled'}
                  </li>
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Edit Plan limits: {editingPlan.name}</h2>
                <p className="text-sm text-slate-500">Changes will instantly apply to all tenants currently on this plan tier.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="p-5 space-y-4" onSubmit={handleSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Display Name</span>
                  <Input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Price (USD / mo)</span>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Max Users</span>
                  <Input
                    type="number"
                    required
                    min={-1}
                    value={editForm.max_users}
                    onChange={(e) => setEditForm({ ...editForm, max_users: Number(e.target.value) })}
                  />
                  <span className="block text-[10px] text-slate-400">-1 for Unlimited</span>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Max Products</span>
                  <Input
                    type="number"
                    required
                    min={-1}
                    value={editForm.max_products}
                    onChange={(e) => setEditForm({ ...editForm, max_products: Number(e.target.value) })}
                  />
                  <span className="block text-[10px] text-slate-400">-1 for Unlimited</span>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Max Warehouses</span>
                  <Input
                    type="number"
                    required
                    min={-1}
                    value={editForm.max_warehouses}
                    onChange={(e) => setEditForm({ ...editForm, max_warehouses: Number(e.target.value) })}
                  />
                  <span className="block text-[10px] text-slate-400">-1 for Unlimited</span>
                </label>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Enabled Features</span>
                <div className="grid gap-2 grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editForm.feature_analytics}
                      onChange={(e) => setEditForm({ ...editForm, feature_analytics: e.target.checked })}
                    />
                    Analytics & Charts
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editForm.feature_barcode}
                      onChange={(e) => setEditForm({ ...editForm, feature_barcode: e.target.checked })}
                    />
                    Barcode Scanner
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editForm.feature_audit_logs}
                      onChange={(e) => setEditForm({ ...editForm, feature_audit_logs: e.target.checked })}
                    />
                    Audit Logs
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editForm.feature_procurement}
                      onChange={(e) => setEditForm({ ...editForm, feature_procurement: e.target.checked })}
                    />
                    Procurement Module
                  </label>
                </div>
              </div>

              <label className="block space-y-1.5 text-sm font-medium">
                <span>Description</span>
                <Input
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </label>

              {updatePlanMutation.isError && (
                <p className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" /> Failed to update plan configurations.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => setEditingPlan(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* active tenant billing status list */}
      <div className="mt-8">
        <SectionCard>
          <SectionHeader
            title="Tenant Subscription Registry"
            description="Operational billing limits and statuses across the platform. Click dashboard cards to filter list."
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">Tenant / Organization</th>
                  <th className="px-6 py-3">Active Subscription</th>
                  <th className="px-6 py-3">User Quota</th>
                  <th className="px-6 py-3">Product Quota</th>
                  <th className="px-6 py-3">Warehouse Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.company_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.users_count} / <span className="font-semibold">{t.max_users === -1 ? '∞' : t.max_users}</span> users
                    </td>
                    <td className="px-6 py-4">
                      {t.products_count} / <span className="font-semibold">{t.max_products === -1 ? '∞' : t.max_products}</span> SKUs
                    </td>
                    <td className="px-6 py-4">
                      {t.warehouses_count} / <span className="font-semibold">{t.max_warehouses === -1 ? '∞' : t.max_warehouses}</span> warehouses
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}
