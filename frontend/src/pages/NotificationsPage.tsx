import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, Calendar, Check, RefreshCw, Search, X } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { cn } from '../lib/cn';
import {
  deleteNotification,
  listNotifications,
  markNotificationRead,
  type NotificationItem,
} from '../lib/notification-api';

type FilterKey = 'all' | 'unread' | 'critical' | 'inventory' | 'suppliers' | 'procurement' | 'ai' | 'billing';
type SortKey = 'newest' | 'oldest' | 'priority';

const filters: Array<{ key: FilterKey; label: string; group?: string; priority?: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'critical', label: 'Critical', priority: 'critical' },
  { key: 'inventory', label: 'Inventory', group: 'inventory' },
  { key: 'suppliers', label: 'Suppliers', group: 'suppliers' },
  { key: 'procurement', label: 'Purchase Orders', group: 'procurement' },
  { key: 'ai', label: 'AI', group: 'ai' },
  { key: 'billing', label: 'Billing', group: 'billing' },
];

const priorityTone: Record<string, 'red' | 'amber' | 'violet' | 'slate'> = {
  critical: 'red',
  high: 'amber',
  medium: 'violet',
  normal: 'slate',
};

function notificationRoute(item: NotificationItem) {
  if (!item.entity_id) {
    if (item.group === 'ai') return '/dashboard';
    if (item.group === 'platform') return '/tenants';
    return '/notifications';
  }
  if (item.entity_type === 'product') return `/products/${item.entity_id}`;
  if (item.entity_type === 'purchase_order') return `/purchase-orders/${item.entity_id}`;
  if (item.entity_type === 'supplier') return `/suppliers/${item.entity_id}`;
  if (item.entity_type === 'tenant') return `/tenants/${item.entity_id}`;
  if (item.entity_type === 'user') return '/users';
  if (item.entity_type === 'warehouse') return '/warehouses';
  return '/notifications';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const filter = filters.find((item) => item.key === activeFilter) ?? filters[0];

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'page', activeFilter, search, sort],
    queryFn: () =>
      listNotifications({
        includeRead: activeFilter !== 'unread',
        limit: 100,
        group: filter.group,
        priority: filter.priority,
        search: search.trim() || undefined,
        sort,
      }),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  const markReadMutation = useMutation({
    mutationFn: (id?: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const openNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markReadMutation.mutateAsync(item.id);
    }
    navigate(notificationRoute(item));
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Communication"
        title="Notification Center"
        description="Role-based inventory, warehouse, procurement, supplier, AI, and platform alerts."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reload
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => markReadMutation.mutate(undefined)}
              disabled={unreadCount === 0 || markReadMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" /> Mark All Read
            </button>
          </div>
        }
      />

      <SectionCard>
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveFilter(item.key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    activeFilter === item.key
                      ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 sm:w-72"
                  placeholder="Search notifications"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                aria-label="Sort notifications"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        <SectionHeader
          title="Alert History"
          description={`${notifications.length} notification${notifications.length === 1 ? '' : 's'} loaded. Polling every 30 seconds for real-time updates.`}
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
          <div className="p-8 text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-900">No notifications yet</h3>
            <p className="mt-1 text-sm text-slate-500">We'll notify you when important inventory events occur.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={cn('flex gap-4 p-4 transition hover:bg-slate-50', !item.is_read && 'bg-indigo-50/20')}
              >
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  className="flex min-w-0 flex-1 gap-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-950">{item.title}</span>
                      {!item.is_read ? <span className="h-2 w-2 rounded-full bg-indigo-600" aria-label="Unread" /> : null}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">{item.message}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={priorityTone[item.priority] ?? 'slate'}>{item.priority}</Badge>
                      <Badge tone="blue">{item.group}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </span>
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-start gap-2">
                  {!item.is_read ? (
                    <button
                      type="button"
                      className="rounded-full bg-indigo-50 p-1.5 text-indigo-600 transition hover:bg-indigo-100"
                      onClick={() => markReadMutation.mutate(item.id)}
                      title="Mark read"
                      aria-label="Mark notification read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-full bg-slate-50 p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => deleteMutation.mutate(item.id)}
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
