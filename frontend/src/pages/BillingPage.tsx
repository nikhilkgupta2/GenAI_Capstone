import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CreditCard,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { getTenants } from '../lib/super-admin-api';

export function BillingPage() {
  const { data: tenants = [], isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'billing-tenants'],
    queryFn: () => getTenants(),
  });

  const [selectedPlanFilter, setSelectedPlanFilter] = useState('');

  if (isLoading) {
    return (
      <Page>
        <LoadingState label="Loading subscription details..." />
      </Page>
    );
  }

  if (isError) {
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
    if (t.plan === 'enterprise') return total + 499;
    if (t.plan === 'pro') return total + 99;
    return total; // free trial
  }, 0);

  const planStats = tenants.reduce(
    (acc, t) => {
      if (t.plan === 'enterprise') acc.enterprise++;
      else if (t.plan === 'pro') acc.pro++;
      else acc.free++;
      return acc;
    },
    { free: 0, pro: 0, enterprise: 0 }
  );

  const filteredTenants = selectedPlanFilter
    ? tenants.filter((t) => t.plan === selectedPlanFilter)
    : tenants;

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

        {/* Free Plan Card */}
        <section
          className={`cursor-pointer rounded-lg border p-5 shadow-sm transition hover:border-slate-400 ${
            selectedPlanFilter === 'free' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-white'
          }`}
          onClick={() => setSelectedPlanFilter(selectedPlanFilter === 'free' ? '' : 'free')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">Free Trial Tier</p>
            <Package className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950">{planStats.free}</p>
          <p className="mt-1 text-xs text-slate-500">Click to filter ($0 / tenant / mo)</p>
        </section>

        {/* Pro Plan Card */}
        <section
          className={`cursor-pointer rounded-lg border p-5 shadow-sm transition hover:border-slate-400 ${
            selectedPlanFilter === 'pro' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-white'
          }`}
          onClick={() => setSelectedPlanFilter(selectedPlanFilter === 'pro' ? '' : 'pro')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">Professional Tier</p>
            <Layers className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950">{planStats.pro}</p>
          <p className="mt-1 text-xs text-slate-500">Click to filter ($99 / tenant / mo)</p>
        </section>

        {/* Enterprise Plan Card */}
        <section
          className={`cursor-pointer rounded-lg border p-5 shadow-sm transition hover:border-slate-400 ${
            selectedPlanFilter === 'enterprise' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-white'
          }`}
          onClick={() => setSelectedPlanFilter(selectedPlanFilter === 'enterprise' ? '' : 'enterprise')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">Enterprise Tier</p>
            <CreditCard className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950">{planStats.enterprise}</p>
          <p className="mt-1 text-xs text-slate-500">Click to filter ($499 / tenant / mo)</p>
        </section>
      </div>

      {/* Pricing Configuration Catalog */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Standard Pack</span>
            <h3 className="mt-2 text-xl font-bold text-slate-950">Free Trial</h3>
            <p className="mt-1 text-sm text-slate-500">For small teams starting their inventory system.</p>
            <div className="my-4 border-t border-slate-100 pt-4">
              <p className="text-3xl font-extrabold text-slate-950">$0 <span className="text-sm font-normal text-slate-500">/ month</span></p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">✓ Max 5 active users</li>
              <li className="flex items-center gap-2">✓ 2 Warehouses maximum</li>
              <li className="flex items-center gap-2">✓ Up to 100 catalog SKUs</li>
              <li className="flex items-center gap-2 text-slate-400">✗ Analytics & charts disabled</li>
              <li className="flex items-center gap-2 text-slate-400">✗ Barcode scanner module disabled</li>
            </ul>
          </div>
        </section>

        <section className="rounded-lg border border-indigo-200 bg-indigo-50/10 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Popular</div>
          <div>
            <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">Scaling Pack</span>
            <h3 className="mt-2 text-xl font-bold text-slate-950">Professional</h3>
            <p className="mt-1 text-sm text-slate-500">For retailers operating multi-warehouse configurations.</p>
            <div className="my-4 border-t border-indigo-100 pt-4">
              <p className="text-3xl font-extrabold text-slate-950">$99 <span className="text-sm font-normal text-slate-500">/ month</span></p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">✓ Up to 25 active users</li>
              <li className="flex items-center gap-2">✓ 10 Warehouses maximum</li>
              <li className="flex items-center gap-2">✓ Up to 5,000 catalog SKUs</li>
              <li className="flex items-center gap-2">✓ Dynamic analytics & charts</li>
              <li className="flex items-center gap-2">✓ Full barcode scanner functionality</li>
            </ul>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">Custom Pack</span>
            <h3 className="mt-2 text-xl font-bold text-slate-950">Enterprise</h3>
            <p className="mt-1 text-sm text-slate-500">For global logistics chains with high throughput.</p>
            <div className="my-4 border-t border-slate-100 pt-4">
              <p className="text-3xl font-extrabold text-slate-950">$499 <span className="text-sm font-normal text-slate-500">/ month</span></p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">✓ Unlimited users</li>
              <li className="flex items-center gap-2">✓ Unlimited warehouse buildings</li>
              <li className="flex items-center gap-2">✓ Unlimited product catalog items</li>
              <li className="flex items-center gap-2">✓ Dedicated auditing & compliance</li>
              <li className="flex items-center gap-2">✓ Custom API integrations</li>
            </ul>
          </div>
        </section>
      </div>

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
                      {t.users_count} / <span className="font-semibold">{t.max_users}</span> users
                    </td>
                    <td className="px-6 py-4">
                      {t.products_count} / <span className="font-semibold">{t.max_products}</span> SKUs
                    </td>
                    <td className="px-6 py-4">
                      {t.warehouses_count} / <span className="font-semibold">{t.max_warehouses}</span> warehouses
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
