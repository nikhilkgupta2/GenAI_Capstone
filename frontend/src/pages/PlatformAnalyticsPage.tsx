import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Boxes, ClipboardList, Layers, TrendingUp, Users, Warehouse } from 'lucide-react';
import { Page, PageHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { getPlatformAnalytics, getTenant } from '../lib/super-admin-api';
import { getAdminTenantDrilldown } from '../lib/dashboard-api';
import { DonutChartCard, LineChartCard, VerticalBarChartCard } from '../components/dashboard/DashboardCharts';
import { useAuthStore } from '../lib/auth-store';

function StatCard({ title, value, description, icon: Icon }: { title: string; value: string | number; description?: string; icon: any }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value.toLocaleString()}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </section>
  );
}

export function PlatformAnalyticsPage() {
  const selectedTenantId = useAuthStore((state) => state.selectedTenantId);

  // Platform Analytics Query
  const platformQuery = useQuery({
    queryKey: ['super-admin', 'analytics'],
    queryFn: getPlatformAnalytics,
    enabled: !selectedTenantId,
  });

  // Tenant Drilldown Query
  const drilldownQuery = useQuery({
    queryKey: ['dashboard', 'admin', 'tenant-select', selectedTenantId],
    queryFn: () => getAdminTenantDrilldown(selectedTenantId!),
    enabled: !!selectedTenantId,
  });

  // Tenant General Details Query
  const tenantDetailsQuery = useQuery({
    queryKey: ['super-admin', 'tenant-details', selectedTenantId],
    queryFn: () => getTenant(selectedTenantId!),
    enabled: !!selectedTenantId,
  });

  const isLoading = selectedTenantId
    ? (drilldownQuery.isLoading || tenantDetailsQuery.isLoading)
    : platformQuery.isLoading;

  const isError = selectedTenantId
    ? (drilldownQuery.isError || tenantDetailsQuery.isError)
    : platformQuery.isError;

  if (isLoading) {
    return (
      <Page>
        <LoadingState label={selectedTenantId ? "Loading tenant analytics..." : "Loading platform analytics..."} />
      </Page>
    );
  }

  if (isError) {
    return (
      <Page>
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {selectedTenantId ? "Tenant analytics could not be loaded." : "Platform analytics could not be loaded."}
        </p>
      </Page>
    );
  }

  // --- RENDER TENANT FOCUS MODE ---
  if (selectedTenantId && drilldownQuery.data && tenantDetailsQuery.data) {
    const drilldown = drilldownQuery.data;
    const tenant = tenantDetailsQuery.data;

    // Format data for charts
    const activityTrendData = drilldown.activity_trends.map((t) => ({
      period: t.period,
      events: t.transaction_count,
      units: t.units_moved,
    }));

    const categoryData = drilldown.category_stats.map((c) => ({
      label: c.category,
      count: c.product_count,
    }));

    return (
      <Page>
        <PageHeader
          eyebrow={`Tenant Insights / ${tenant.company_name}`}
          title={`${tenant.company_name} Analytics`}
          description={`Workspace plan: ${tenant.plan.toUpperCase()}. Monitoring activity, user metrics, and stock distribution.`}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Users" value={tenant.users_count} icon={Users} description={`User limit: ${tenant.max_users}`} />
          <StatCard title="Products Tracked" value={tenant.products_count} icon={Boxes} description={`Product limit: ${tenant.max_products}`} />
          <StatCard title="Warehouses Managed" value={tenant.warehouses_count} icon={Warehouse} description={`Warehouse limit: ${tenant.max_warehouses}`} />
          <StatCard title="Total Inventory Units" value={drilldown.tenant.inventory_units} icon={Layers} description="All-time stocked items" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard title="Low Stock Alerts" value={drilldown.low_stock_products} icon={AlertCircle} description="Products requiring replenishment" />
          <StatCard title="Units Stocked In" value={drilldown.movement_summary.stock_in} icon={TrendingUp} />
          <StatCard title="Units Dispatched (Out)" value={drilldown.movement_summary.stock_out} icon={ClipboardList} />
        </div>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
          <LineChartCard
            title="SaaS Workspace Activity"
            description="Transaction events inside the tenant's workspace."
            data={activityTrendData}
          />

          <VerticalBarChartCard
            title="Product Category Distribution"
            description="Quantity and type counts grouped by inventory categories."
            data={categoryData}
            bars={[{ key: 'count', name: 'Products', color: '#10b981' }]}
          />
        </div>
      </Page>
    );
  }

  // --- RENDER PLATFORM WIDE MODE ---
  const data = platformQuery.data!;
  const tenantGrowthTrend = data.tenant_growth.map((g) => ({
    period: g.name,
    events: g.tenants,
    units: 0,
  }));

  const onboardingFunnelData = [
    { label: 'Imported CSV', count: data.onboarding_funnel.imported_csv },
    { label: 'Created WH', count: data.onboarding_funnel.created_warehouse },
    { label: 'Added Products', count: data.onboarding_funnel.added_products },
    { label: 'Invited Users', count: data.onboarding_funnel.invited_users },
    { label: 'Completed 100%', count: data.onboarding_funnel.completed },
  ];

  const usageRatioData = [
    { label: 'Active Tenants', value: data.active_tenants },
    { label: 'Inactive / Pending / Suspended', value: Math.max(0, data.total_tenants - data.active_tenants) },
  ];

  const activityTrendData = data.activity_trend.map((t) => ({
    period: t.name,
    events: t.transactions,
    units: 0,
  }));

  return (
    <Page>
      <PageHeader
        eyebrow="Platform Insights"
        title="Platform Analytics"
        description="Aggregate business indicators, multi-tenant usage metrics, and growth trajectories."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Registered Tenants" value={data.total_tenants} icon={Warehouse} description="All time registrations" />
        <StatCard title="Active Tenants Ratio" value={`${Math.round(data.active_ratio * 100)}%`} icon={TrendingUp} description="Ratio of active to total tenants" />
        <StatCard title="Total Platform Users" value={data.total_users} icon={Users} description="Combined users across all tenants" />
        <StatCard title="Avg. Onboarding Progress" value={`${Math.round(data.avg_onboarding_completion)}%`} icon={Layers} description="Dynamic progress across active/pending accounts" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard title="Total Products Tracked" value={data.total_products} icon={Boxes} />
        <StatCard title="Total Warehouses Managed" value={data.total_warehouses} icon={Warehouse} />
        <StatCard title="All-Time Move Transactions" value={data.total_transactions} icon={ClipboardList} />
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <LineChartCard
          title="Tenant Registration Growth"
          description="Cumulative count of registered SaaS tenants over the last 6 months."
          data={tenantGrowthTrend}
        />

        <VerticalBarChartCard
          title="Tenant Onboarding Funnel"
          description="Number of tenants completing each key step of the onboarding process."
          data={onboardingFunnelData}
          bars={[{ key: 'count', name: 'Tenants Count', color: '#2563eb' }]}
        />
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineChartCard
            title="All-Tenant Move Activity"
            description="Combined transaction events across the entire SaaS environment."
            data={activityTrendData}
          />
        </div>
        <div>
          <DonutChartCard
            title="Tenant Activation Mix"
            description="Comparison of active tenants versus inactive or suspended tenants."
            data={usageRatioData}
            dataKey="value"
            nameKey="label"
          />
        </div>
      </div>
    </Page>
  );
}
