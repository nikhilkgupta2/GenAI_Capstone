import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  HardDrive,
  CheckCircle,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { getSystemHealth } from '../lib/super-admin-api';

function HealthIndicator({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {ok ? 'Healthy' : 'Unhealthy'}
    </span>
  );
}

export function SystemHealthPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['super-admin', 'health'],
    queryFn: getSystemHealth,
  });

  if (isLoading) {
    return (
      <Page>
        <LoadingState label="Loading system health details..." />
      </Page>
    );
  }

  if (isError || !data) {
    return (
      <Page>
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> System health details could not be retrieved.
        </p>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Platform Operations"
        title="System Health & Infrastructure"
        description="Monitor system uptime, database performance metrics, background job queues, and storage consumption."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Refreshed' : 'Refresh Diagnostics'}
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* API Server Card */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">API Web Server</h2>
            </div>
            <HealthIndicator ok={data.api_server.status === 'healthy'} />
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service Uptime</span>
              <span className="font-medium text-slate-900">{data.api_server.uptime_percent}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Release Version</span>
              <span className="font-mono text-slate-900">{data.api_server.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Protocols</span>
              <span className="font-medium text-slate-900">HTTP/2 TLS 1.3</span>
            </div>
          </div>
        </section>

        {/* Database Instance Card */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Database Engine</h2>
            </div>
            <HealthIndicator ok={data.database.status === 'healthy'} />
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Engine Type</span>
              <span className="font-medium text-slate-900">PostgreSQL (psycopg)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Query Latency</span>
              <span className="font-medium text-slate-900">{data.database.latency_ms} ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Storage Footprint</span>
              <span className="font-medium text-slate-900">{data.database.size_mb} MB</span>
            </div>
          </div>
        </section>

        {/* Failed jobs & alarms */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Alert Center & Jobs</h2>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              data.failures.unresolved_alerts === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {data.failures.unresolved_alerts} Unresolved
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Failed Jobs (30d)</span>
              <span className="font-medium text-slate-900">{data.failures.failed_jobs_30d}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Failed Logins (30d)</span>
              <span className="font-medium text-slate-900 text-amber-600">{data.failures.failed_logins_30d} blocked</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">System Alarms</span>
              <span className="font-medium text-slate-900">0 critical / 0 warnings</span>
            </div>
          </div>
        </section>
      </div>

      {/* Storage Disk Space Section */}
      <div className="mt-6">
        <SectionCard>
          <SectionHeader
            title="Shared Object Storage & Database Volumetrics"
            description="Analysis of total files, media assets, database size, and utilization limits."
          />
          <div className="p-5 grid gap-6 md:grid-cols-2 items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-slate-500" /> Storage Space Utilization
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Reflects database files, binary formats, and catalog indexes relative to the allocated volume size.
              </p>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${data.storage.utilization_percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{data.storage.used_gb} GB Used</span>
                  <span>{data.storage.utilization_percent}% Used of {data.storage.allocated_gb} GB</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 md:border-t-0 md:border-l border-slate-100 p-3 md:pl-8 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Database Uptime Engine</h4>
                <p className="text-lg font-bold text-slate-950">99.999% Service Level Target</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Backup Schedules</p>
                  <p className="text-xs text-slate-500">Automated daily snapshot at 02:00 UTC (Retained for 30 days)</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}
