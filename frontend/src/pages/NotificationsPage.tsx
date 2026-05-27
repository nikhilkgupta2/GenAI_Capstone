import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { LoadingState } from '../components/ui/LoadingState';
import { listNotifications, markNotificationRead } from '../lib/notification-api';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [includeRead, setIncludeRead] = useState(false);

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', includeRead],
    queryFn: () => listNotifications(includeRead),
  });

  const markReadMutation = useMutation({
    mutationFn: (id?: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAllRead = () => {
    markReadMutation.mutate(undefined);
  };

  const handleMarkOneRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Communication"
        title="Notification Center"
        description="Receive platform warnings, tenant requests, audit alerts, and support announcements."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reload
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              onClick={handleMarkAllRead}
              disabled={notifications.every((n) => n.is_read)}
            >
              <Check className="h-3.5 w-3.5" /> Mark All Read
            </button>
          </div>
        }
      />

      <div className="mb-5 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={includeRead}
            onChange={(e) => setIncludeRead(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show already read notifications
        </label>
      </div>

      <SectionCard>
        <SectionHeader
          title="Alert History"
          description={`${notifications.length} notification${notifications.length === 1 ? '' : 's'} loaded.`}
        />

        {isLoading ? (
          <div className="p-5">
            <LoadingState label="Loading alerts..." />
          </div>
        ) : isError ? (
          <p className="flex items-center gap-2 p-5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> Failed to load notifications.
          </p>
        ) : notifications.length === 0 ? (
          <div className="p-5 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-2 font-medium text-slate-900">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">No pending alerts requiring attention.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-4 p-4 transition ${
                  n.is_read ? 'bg-white opacity-60' : 'bg-indigo-50/10'
                }`}
              >
                <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-500 h-9 w-9 flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950 text-sm break-words">{n.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                      {!n.is_read && (
                        <button
                          type="button"
                          className="rounded-full bg-indigo-50 p-1 text-indigo-600 hover:bg-indigo-100"
                          onClick={() => handleMarkOneRead(n.id)}
                          title="Mark read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 break-words">{n.message}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                      {n.type}
                    </span>
                    <span className="inline-flex rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 uppercase">
                      {n.group}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
