import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, ClipboardCheck, X, UserCheck, Slash, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../components/Button';
import { Badge } from '../components/ui/Badge';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { approveStockAdjustment, listApprovals, rejectStockAdjustment, type ApprovalQueueItem } from '../lib/audit-api';
import { approveStockTransfer, cancelStockTransfer } from '../lib/warehouse-api';
import { useAuthStore } from '../lib/auth-store';
import { getTenants, updateTenantStatus } from '../lib/super-admin-api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function typeLabel(type: ApprovalQueueItem['type']) {
  return type.replace('_', ' ');
}

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const selectedTenantId = useAuthStore((state) => state.selectedTenantId);

  // Retailer approvals queries
  const approvalsQuery = useQuery({
    queryKey: ['approvals'],
    queryFn: listApprovals,
    enabled: role !== 'super_admin',
  });

  // Super Admin tenant approvals query
  const tenantApprovalsQuery = useQuery({
    queryKey: ['super-admin', 'pending-tenants'],
    queryFn: () => getTenants(undefined, 'pending'),
    enabled: role === 'super_admin',
  });

  const approveMutation = useMutation({
    mutationFn: approveStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-history'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });
  const transferMutation = useMutation({
    mutationFn: ({ transferId, action, adminNotes }: { transferId: string; action: 'approve' | 'reject'; adminNotes?: string }) => {
      if (action === 'approve') return approveStockTransfer(transferId, { admin_notes: adminNotes });
      return cancelStockTransfer(transferId, { admin_notes: adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  const [rejectingTenantId, setRejectingTenantId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Spam/Fake registration');

  // Super Admin action mutation
  const tenantStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      updateTenantStatus(id, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'pending-tenants'] });
      setRejectingTenantId(null);
    },
  });

  if (role === 'super_admin') {
    const rawPendingTenants = tenantApprovalsQuery.data ?? [];
    const pendingTenants = selectedTenantId
      ? rawPendingTenants.filter((t) => t.id === selectedTenantId)
      : rawPendingTenants;
    return (
      <Page>
        <PageHeader
          eyebrow="Platform Approvals"
          title="Tenant Registration Approvals"
          description="Review, approve, or reject new SaaS organization sign-ups requesting access to the platform."
        />

        <SectionCard>
          <SectionHeader
            title="Pending Tenant Approvals"
            description={`${pendingTenants.length} registration requests awaiting review.`}
          />

          {tenantApprovalsQuery.isLoading ? (
            <div className="p-5">
              <LoadingState label="Loading pending registrations..." />
            </div>
          ) : tenantApprovalsQuery.isError ? (
            <p className="flex items-center gap-2 p-5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> Failed to load registration approvals queue.
            </p>
          ) : pendingTenants.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No pending registrations"
                description="Registration requests will appear here when new organizations complete the sign-up process."
              />
            </div>
          ) : (
            <DataTable className="rounded-none border-x-0 border-b-0 shadow-none">
              <DataTableHeader>
                <tr>
                  <DataTableHead>Company Name</DataTableHead>
                  <DataTableHead>Contact Email</DataTableHead>
                  <DataTableHead>Billing Plan</DataTableHead>
                  <DataTableHead>Created Date</DataTableHead>
                  <DataTableHead>Actions</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {pendingTenants.map((t) => (
                  <DataTableRow key={t.id}>
                    <DataTableCell className="font-semibold text-slate-900">{t.company_name}</DataTableCell>
                    <DataTableCell>{t.contact_email}</DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-700">
                        {t.plan}
                      </span>
                    </DataTableCell>
                    <DataTableCell>{formatDate(t.created_at)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-2">
                        <Link
                          to={`/tenants/${t.id}`}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" /> Details
                        </Link>
                        <Button
                          type="button"
                          className="h-8 px-3 inline-flex items-center"
                          onClick={() => tenantStatusMutation.mutate({ id: t.id, status: 'active' })}
                        >
                          <UserCheck className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          type="button"
                          className="h-8 bg-red-600 px-3 hover:bg-red-500 inline-flex items-center"
                          onClick={() => setRejectingTenantId(t.id)}
                        >
                          <Slash className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </SectionCard>

        {rejectingTenantId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-950">Reject Tenant Registration</h2>
              <p className="mt-2 text-sm text-slate-600">
                Please specify a rejection reason. This is mandatory and will be logged and displayed to the tenant on login attempt.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">Rejection Reason</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="Spam/Fake registration ">Spam/Fake registration</option>
                  <option value="Incorrect / Invalid contact email">Incorrect / Invalid contact email</option>
                  <option value="Business verification failed">Business verification failed</option>
                  <option value="Violates Terms of Service">Violates Terms of Service</option>
                  <option value="Other / Security Concern">Other / Security Concern</option>
                </select>
              </div>
              {tenantStatusMutation.isError ? (
                <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" /> Failed to reject tenant.
                </p>
              ) : null}
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => setRejectingTenantId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 hover:bg-red-500"
                  disabled={tenantStatusMutation.isPending}
                  onClick={() => tenantStatusMutation.mutate({ id: rejectingTenantId, status: 'rejected', rejectionReason })}
                >
                  {tenantStatusMutation.isPending ? 'Rejecting...' : 'Reject Tenant'}
                </Button>
              </div>
            </section>
          </div>
        ) : null}
      </Page>
    );
  }

  const approvals = approvalsQuery.data ?? [];

  return (
    <Page>
      <PageHeader
        eyebrow="Controls"
        title="Approval queue"
        description="Review pending stock adjustment, warehouse transfer, and purchase order approvals."
      />

      <SectionCard>
        <SectionHeader title="Pending approvals" description={`${approvals.length.toLocaleString()} item${approvals.length === 1 ? '' : 's'} awaiting review.`} />
        {approvalsQuery.isLoading ? (
          <div className="p-5">
            <LoadingState label="Loading approval queue..." />
          </div>
        ) : approvalsQuery.isError ? (
          <p className="flex items-center gap-2 p-5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> Approval queue could not be loaded.
          </p>
        ) : approvals.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No pending approvals" description="Approval requests will appear here when operational users submit controlled actions." />
          </div>
        ) : (
          <DataTable className="rounded-none border-x-0 border-b-0 shadow-none">
            <DataTableHeader>
              <tr>
                <DataTableHead>Request</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead>Requested by</DataTableHead>
                <DataTableHead>Created</DataTableHead>
                <DataTableHead>Actions</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {approvals.map((item) => (
                <DataTableRow key={`${item.type}-${item.id}`}>
                  <DataTableCell>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge tone={item.type === 'stock_adjustment' ? 'amber' : item.type === 'warehouse_transfer' ? 'blue' : 'green'}>
                      {typeLabel(item.type)}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>{item.requested_by_name || item.requested_by || 'System'}</DataTableCell>
                  <DataTableCell>{formatDate(item.created_at)}</DataTableCell>
                  <DataTableCell>
                    {item.type === 'stock_adjustment' ? (
                      <div className="flex gap-2">
                        <Button type="button" className="h-8 px-3" onClick={() => approveMutation.mutate(item.id)}>
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          type="button"
                          className="h-8 bg-slate-700 px-3 hover:bg-slate-600"
                          onClick={() => rejectMutation.mutate(item.id)}
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : item.type === 'warehouse_transfer' ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="h-8 px-3"
                          disabled={transferMutation.isPending}
                          onClick={() => {
                            const adminNotes = window.prompt('Admin notes for approval (optional)') || undefined;
                            transferMutation.mutate({ transferId: item.id, action: 'approve', adminNotes });
                          }}
                        >
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          type="button"
                          className="h-8 bg-slate-700 px-3 hover:bg-slate-600"
                          disabled={transferMutation.isPending}
                          onClick={() => {
                            const adminNotes = window.prompt('Reason for rejection (optional)') || undefined;
                            transferMutation.mutate({ transferId: item.id, action: 'reject', adminNotes });
                          }}
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                        <ClipboardCheck className="h-4 w-4" /> Review in source module
                      </span>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </SectionCard>
    </Page>
  );
}
