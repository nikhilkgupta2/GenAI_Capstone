import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Check, ClipboardList, PackageCheck, ShieldCheck, Truck, UserPlus } from 'lucide-react';

import type { AuthUser } from '../../lib/auth-store';
import { cn } from '../../lib/cn';
import {
  getUnreadNotificationCount,
  listNotifications,
  markNotificationRead,
  type NotificationItem,
} from '../../lib/notification-api';

type NotificationTone = 'amber' | 'blue' | 'green' | 'red' | 'slate' | 'violet';

const toneClass: Record<NotificationTone, string> = {
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-sky-50 text-sky-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-50 text-violet-700',
};

const iconByType = {
  low_stock: AlertTriangle,
  transfer_approved: Truck,
  transfer_pending: Truck,
  po_approved: ClipboardList,
  po_pending: ClipboardList,
  shipment_delayed: AlertTriangle,
  stock_adjustment: PackageCheck,
  inventory_movement: PackageCheck,
  new_user_added: UserPlus,
  platform_activity: ShieldCheck,
  out_of_stock: AlertTriangle,
  reorder_recommended: PackageCheck,
  supplier_updated: Truck,
  supplier_inactive: Truck,
  supplier_performance_drop: AlertTriangle,
  stockout_risk: AlertTriangle,
  dead_stock_detected: AlertTriangle,
  audit_event: ShieldCheck,
  new_tenant_registered: ShieldCheck,
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toneForNotification(item: NotificationItem): NotificationTone {
  if (item.priority === 'critical') {
    return 'red';
  }
  if (item.type.includes('delayed') || item.type === 'low_stock') {
    return 'amber';
  }
  if (item.type.includes('approved')) {
    return 'green';
  }
  if (item.group === 'platform' || item.group === 'users') {
    return 'blue';
  }
  if (item.group === 'ai') {
    return 'violet';
  }
  return 'slate';
}

function notificationRoute(item: NotificationItem, canViewAllNotifications: boolean) {
  if (!item.entity_id) {
    if (item.group === 'ai') return '/dashboard';
    if (item.group === 'platform') return '/tenants';
    return canViewAllNotifications ? '/notifications' : '/dashboard';
  }
  if (item.entity_type === 'product') return `/products/${item.entity_id}`;
  if (item.entity_type === 'purchase_order') return `/purchase-orders/${item.entity_id}`;
  if (item.entity_type === 'supplier') return `/suppliers/${item.entity_id}`;
  if (item.entity_type === 'warehouse') return '/warehouses';
  if (item.entity_type === 'user') return '/users';
  if (item.entity_type === 'tenant') return `/tenants/${item.entity_id}`;
  return canViewAllNotifications ? '/notifications' : '/dashboard';
}

export function NotificationCenter({ user }: { user: AuthUser | null }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const canViewAllNotifications = user?.role === 'super_admin';
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: async () => {
      try {
        return await listNotifications({ includeRead: false, limit: 12 });
      } catch {
        return [];
      }
    },
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        return await getUnreadNotificationCount();
      } catch {
        return 0;
      }
    },
    enabled: Boolean(user),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData<NotificationItem[]>(['notifications', 'bell'], (current = []) =>
        notificationId ? current.filter((item) => item.id !== notificationId) : [],
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? notifications.filter((item) => !item.is_read).length;
  const groupedNotifications = notifications.reduce<Record<string, NotificationItem[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});

  const handleOpenNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markReadMutation.mutateAsync(item.id);
    }
    setOpen(false);
    navigate(notificationRoute(item, canViewAllNotifications));
  };

  return (
    <div className="relative">
      <button
        className="relative grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <div
        className={cn(
          'absolute right-0 top-11 z-50 w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-0 shadow-2xl transition',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 pointer-events-none',
        )}
        role="menu"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Notifications</p>
            <p className="text-xs text-slate-500">{unreadCount} unread operational update{unreadCount === 1 ? '' : 's'}</p>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            type="button"
            disabled={unreadCount === 0 || markReadMutation.isPending}
            onClick={() => markReadMutation.mutate(undefined)}
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {notificationsQuery.isLoading ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-900">No notifications yet</p>
              <p className="mt-1 text-xs text-slate-500">We'll notify you when important inventory events occur.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <div key={group}>
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{group}</p>
                  {items.map((item) => {
                    const Icon = iconByType[item.type as keyof typeof iconByType] ?? Bell;
                    const tone = toneForNotification(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenNotification(item)}
                        className={cn(
                          'flex w-full gap-3 rounded-md px-2 py-3 text-left transition hover:bg-slate-50',
                          !item.is_read && 'bg-slate-50',
                        )}
                      >
                        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-md', toneClass[tone])}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.message}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>{formatDate(item.created_at)}</span>
                            <span className="rounded-full bg-white px-1.5 py-0.5 font-semibold uppercase text-slate-500 ring-1 ring-slate-200">
                              {item.priority}
                            </span>
                          </span>
                        </span>
                        {!item.is_read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" /> : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        {canViewAllNotifications ? (
          <div className="border-t border-slate-100 p-2">
            <Link
              to="/notifications"
              className="block rounded-lg px-3 py-2 text-center text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
