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

  // Super Admin action mutation
  const tenantStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTenantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'pending-tenants'] });
    },
  });

  if (role === 'super_admin') {
    const pendingTenants = tenantApprovalsQuery.data ?? [];
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
                          onClick={() => tenantStatusMutation.mutate({ id: t.id, status: 'rejected' })}
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
