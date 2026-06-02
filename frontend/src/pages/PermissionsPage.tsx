import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Lock, Shield, Eye, ShieldAlert, BadgeCheck } from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { getRolePermissions } from '../lib/super-admin-api';

export function PermissionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'permissions'],
    queryFn: getRolePermissions,
  });

  if (isLoading) {
    return (
      <Page>
        <LoadingState label="Loading global permissions..." />
      </Page>
    );
  }

  if (isError || !data) {
    return (
      <Page>
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> Role capability matrix templates could not be loaded.
        </p>
      </Page>
    );
  }

  const roles = Object.keys(data.matrix);

  // Group capabilities by category
  const capabilityLabels: Record<string, string> = {
    'products.create': 'Create Products',
    'products.read': 'Read Products',
    'products.update': 'Edit Products',
    'products.delete': 'Delete Products',
    'inventory.read': 'View Stock',
    'inventory.update': 'Adjust Stock',
    'warehouses.manage': 'Manage Warehouses',
    'warehouses.read': 'View Warehouses',
    'procurement.manage': 'Procurement POs',
    'users.manage': 'Invite/Edit Users',
    'approvals.manage': 'Approve Transfers',
    'audit_logs.read': 'View Audit Logs',
    'exports.execute': 'Export CSV Data',
    'analytics.view': 'View Dashboards',
    'tenants.manage': 'SaaS Tenant Config',
    'analytics.platform': 'Platform Growth Logs',
    'health.view': 'Infrastructure Check',
    'audit_logs.global': 'System Audit Logs',
    'billing.manage': 'Update Plan Tiers',
    'permissions.global': 'Global Permission Matrix',
    'notifications.global': 'System Alerts Engine',
  };

  const capabilities = Array.from(
    new Set(Object.values(data.matrix).flat())
  ).sort((a, b) => a.localeCompare(b));

  return (
    <Page>
      <PageHeader
        eyebrow="Platform Authorization"
        title="Role & Permission Manager"
        description="Review SaaS capability mappings, examine default RBAC matrices, and preview role configurations."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Role Templates</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            System templates used when instantiating new organization domains.
          </p>
          <div className="space-y-3">
            {data.templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center justify-between border border-slate-100 rounded-md p-3">
                <div>
                  <p className="font-medium text-slate-950 text-sm">{tpl.name}</p>
                  <p className="text-xs text-slate-500">{tpl.roles_count} associated roles</p>
                </div>
                <span className="inline-flex rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                  Ready to deploy
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <Lock className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Access Gating Architecture</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              All REST API and Frontend view controllers verify the scopes specified below. Toggling tenant subscription modules takes precedence over role permissions.
            </p>
            <div className="rounded-md bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Permission Check Sequence:</p>
              <p>1. Session checks jwt token signatures.</p>
              <p>2. Tenant check validates whether tenant status is ACTIVE.</p>
              <p>3. Subscription check validates if the required module is enabled.</p>
              <p>4. Role capability match determines access clearance.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8">
        <SectionCard>
          <SectionHeader
            title="RBAC Authorization Matrix"
            description="Default mapping of tenant user roles to granular system capabilities."
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3 min-w-[200px]">System Capability</th>
                  {roles.map((r) => (
                    <th key={r} className="px-6 py-3 text-center whitespace-nowrap">
                      {r.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {capabilities.map((cap) => (
                  <tr key={cap} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-900">
                      <div>{capabilityLabels[cap] || cap}</div>
                      <div className="font-mono text-[10px] text-slate-400">{cap}</div>
                    </td>
                    {roles.map((r) => {
                      const allowed = data.matrix[r].includes(cap);
                      return (
                        <td key={r} className="px-6 py-3 text-center">
                          {allowed ? (
                            <BadgeCheck className="mx-auto h-5 w-5 text-emerald-500" />
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      );
                    })}
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
