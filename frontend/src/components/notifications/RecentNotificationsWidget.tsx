import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';
import { cn } from '../../lib/cn';
import { listNotifications, type NotificationItem } from '../../lib/notification-api';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { SectionCard, SectionHeader } from '../ui/Page';

const priorityTone: Record<string, 'red' | 'amber' | 'violet' | 'slate'> = {
  critical: 'red',
  high: 'amber',
  medium: 'violet',
  normal: 'slate',
};

function notificationRoute(item: NotificationItem, canViewAllNotifications: boolean) {
  if (!item.entity_id) return canViewAllNotifications ? '/notifications' : '/dashboard';
  if (item.entity_type === 'product') return `/products/${item.entity_id}`;
  if (item.entity_type === 'purchase_order') return `/purchase-orders/${item.entity_id}`;
  if (item.entity_type === 'supplier') return `/suppliers/${item.entity_id}`;
  if (item.entity_type === 'tenant') return `/tenants/${item.entity_id}`;
  return canViewAllNotifications ? '/notifications' : '/dashboard';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function RecentNotificationsWidget() {
  const user = useAuthStore((state) => state.user);
  const canViewAllNotifications = user?.role === 'super_admin';
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'dashboard-widget'],
    queryFn: async () => {
      try {
        return await listNotifications({ includeRead: true, limit: 5, sort: 'newest' });
      } catch {
        return [];
      }
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const notifications = notificationsQuery.data ?? [];

  return (
    <SectionCard className="mt-4">
      <SectionHeader
        title="Recent Notifications"
        description="Latest role-scoped alerts and operational updates."
        actions={canViewAllNotifications ? (
          <Link className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500" to="/notifications">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      />
      {notificationsQuery.isLoading ? (
        <div className="p-5">
          <LoadingState label="Loading recent notifications..." />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No notifications yet" description="We'll notify you when important inventory events occur." />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((item) => (
            <Link
              key={item.id}
              to={notificationRoute(item, canViewAllNotifications)}
              className={cn('flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50', !item.is_read && 'bg-indigo-50/20')}
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                <Bell className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                <span className="mt-0.5 block truncate text-sm text-slate-600">{item.message}</span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={priorityTone[item.priority] ?? 'slate'}>{item.priority}</Badge>
                  <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
