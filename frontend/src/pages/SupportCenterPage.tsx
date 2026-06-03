import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  LifeBuoy,
  FileWarning,
  UserX,
  UserCheck,
  Check,
  MessageSquare,
  Clock,
  X
} from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { Badge } from '../components/ui/Badge';
import { useDialog } from '../context/DialogContext';
import { getSupportIssues, resolveSupportRequest, deleteSupportRequest } from '../lib/super-admin-api';

export function SupportCenterPage() {
  const dialog = useDialog();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['super-admin', 'support-issues'],
    queryFn: getSupportIssues,
  });

  const [notice, setNotice] = useState<string | null>(null);
  const [resolvedIssues, setResolvedIssues] = useState<string[]>([]);

  if (isLoading) {
    return (
      <Page>
        <LoadingState label="Loading support issues..." />
      </Page>
    );
  }

  if (isError || !data) {
    return (
      <Page>
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> Support data could not be retrieved.
        </p>
      </Page>
    );
  }

  const handleStatusChange = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      await resolveSupportRequest(id, status);
      setNotice(`Support ticket marked as ${status.toLowerCase()}.`);
      refetch();
    } catch (err) {
      setNotice(`Failed to update support ticket status.`);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const confirmed = await dialog.confirm({
      title: 'Remove Ticket',
      description: 'Are you sure you want to permanently remove this support ticket from the list? This action is irreversible.',
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
      tone: 'danger',
    });

    if (!confirmed) return;
    try {
      await deleteSupportRequest(id);
      setNotice('Support ticket removed.');
      refetch();
    } catch (err) {
      setNotice('Failed to remove support ticket.');
    }
  };

  const openIssues = data.reported_issues;

  const categoryLabels: Record<string, string> = {
    'ACCOUNT_SUSPENDED': 'Account Suspended',
    'ACCOUNT_APPROVE_REQUEST': 'Account Approve Request',
    'OTHER': 'Other Inquiries'
  };


  return (
    <Page>
      <PageHeader
        eyebrow="Help Desk"
        title="Support & Customer Care"
        description="Oversee user feedback tickets, identify stuck onboardings, and troubleshoot CSV import errors."
      />

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Stuck Onboardings Card */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Stuck Onboardings</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {data.summary.stuck_count} accounts
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Tenants with less than 50% setup completion and inactive for over 7 days.
          </p>
        </section>

        {/* Failed CSV Imports Card */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-slate-900">Failed CSV Imports</h2>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {data.summary.failed_imports} incidents
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            System errors detected during bulk inventory file updates in the last 30 days.
          </p>
        </section>

        {/* Unresolved Tickets Card */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-900">Open Tickets</h2>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {openIssues.length} open
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Direct customer inquiries and interface crash telemetry requiring assistance.
          </p>
        </section>
      </div>

      {/* Reported tickets feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-indigo-600" /> Active Support Tickets
          </h2>

          {openIssues.length === 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
              <Check className="mx-auto h-8 w-8 text-emerald-500" />
              <h3 className="mt-2 font-medium text-slate-950">Inbox Cleared</h3>
              <p className="text-sm text-slate-500 mt-1">All user-submitted issues have been resolved.</p>
            </section>
          ) : (
            openIssues.map((issue) => (
              <section key={issue.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {categoryLabels[issue.category] || issue.category}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Reported by <span className="font-bold text-slate-900">{issue.company_name}</span> (<span className="font-bold text-slate-900">{issue.contact_email}</span>)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={issue.status === 'RESOLVED' ? 'green' : issue.status === 'REJECTED' ? 'red' : 'amber'}>
                      {issue.status}
                    </Badge>
                    <div className="flex gap-2">
                      {issue.status === 'PENDING' && (
                        <button
                          type="button"
                          className="inline-flex items-center rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
                          onClick={() => handleStatusChange(issue.id, 'RESOLVED')}
                          title="Mark as Resolved"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Resolved
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition shadow-sm"
                        onClick={() => handleDeleteRequest(issue.id)}
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{issue.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Reported {new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
              </section>
            ))
          )}
        </div>

        {/* Stuck onboarding users list */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserX className="h-5 w-5 text-indigo-600" /> Stuck Setup Funnels
          </h2>

          {data.stuck_onboarding_tenants.length === 0 ? (
            <p className="text-sm text-slate-500">No inactive tenants stuck in setup.</p>
          ) : (
            data.stuck_onboarding_tenants.map((stuck) => (
              <section key={stuck.tenant_id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{stuck.company_name}</h4>
                    <p className="text-xs text-slate-500">{stuck.contact_email}</p>
                  </div>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {stuck.onboarding_percentage}% setup
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Last setup activity: {new Date(stuck.last_activity).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  className="w-full text-center rounded border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  onClick={() => dialog.alert({
                    title: 'Email Sent',
                    description: `A simulated onboarding assistance email has been successfully dispatched to ${stuck.contact_email}.`,
                    confirmLabel: 'Finished',
                    tone: 'success',
                  })}
                >
                  Send Onboarding Assistance Email
                </button>
              </section>
            ))
          )}
        </div>
      </div>
    </Page>
  );
}
