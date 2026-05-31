import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

import { Input } from '../Input';
import { Select } from '../ui/Select';

export type AuditFilterState = {
  search: string;
  module: string;
  action: string;
  status: string;
  actorRole: string;
  date: string;
  tenantId?: string;
};

export function AuditFilters({
  filters,
  modules,
  actions,
  actorRoles,
  tenants,
  onChange,
  onReset,
}: {
  filters: AuditFilterState;
  modules: string[];
  actions: string[];
  actorRoles: string[];
  tenants?: { id: string; company_name: string; status?: string }[];
  onChange: (filters: AuditFilterState) => void;
  onReset: () => void;
}) {
  const [localFilters, setLocalFilters] = useState<AuditFilterState>(filters);

  // Sync state if filters change externally (e.g. from parent reset)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(localFilters);
  };

  const handleReset = () => {
    onReset();
  };

  const approvedTenants = (tenants ?? []).filter(
    (t) => !t.status || t.status === 'active' || t.status === 'suspended'
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-row flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50/60 p-4"
    >
      <label className="flex-1 min-w-[200px] max-w-xs space-y-1.5 text-xs font-semibold text-slate-500">
        <span>Search</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search user, product..."
            value={localFilters.search}
            onChange={(event) => setLocalFilters({ ...localFilters, search: event.target.value })}
          />
        </div>
      </label>

      {tenants && (
        <label className="w-48 space-y-1.5 text-xs font-semibold text-slate-500">
          <span>Workspace Focus</span>
          <Select
            value={localFilters.tenantId ?? ''}
            onChange={(event) => setLocalFilters({ ...localFilters, tenantId: event.target.value })}
          >
            <option value="">Platform Overview</option>
            {approvedTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.company_name}
              </option>
            ))}
          </Select>
        </label>
      )}

      <label className="w-40 space-y-1.5 text-xs font-semibold text-slate-500">
        <span>Module</span>
        <Select
          value={localFilters.module}
          onChange={(event) => setLocalFilters({ ...localFilters, module: event.target.value })}
        >
          <option value="">All modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </Select>
      </label>

      <label className="w-40 space-y-1.5 text-xs font-semibold text-slate-500">
        <span>Action</span>
        <Select
          value={localFilters.action}
          onChange={(event) => setLocalFilters({ ...localFilters, action: event.target.value })}
        >
          <option value="">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </Select>
      </label>

      <label className="w-36 space-y-1.5 text-xs font-semibold text-slate-500">
        <span>Status</span>
        <Select
          value={localFilters.status}
          onChange={(event) => setLocalFilters({ ...localFilters, status: event.target.value })}
        >
          <option value="">All statuses</option>
          {['pending', 'approved', 'rejected', 'cancelled', 'completed', 'recorded'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </label>

      <label className="w-36 space-y-1.5 text-xs font-semibold text-slate-500">
        <span>Role</span>
        <Select
          value={localFilters.actorRole}
          onChange={(event) => setLocalFilters({ ...localFilters, actorRole: event.target.value })}
        >
          <option value="">All roles</option>
          {actorRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </label>

      <label className="w-40 space-y-1.5 text-xs font-semibold text-slate-500">
        <span>Date</span>
        <Input
          type="date"
          value={localFilters.date}
          onChange={(event) => setLocalFilters({ ...localFilters, date: event.target.value })}
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-9 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Apply
        </button>
        <button
          type="button"
          className="h-9 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
