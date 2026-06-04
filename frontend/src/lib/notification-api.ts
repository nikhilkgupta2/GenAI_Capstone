import { api, type ApiEnvelope } from './api';

export type NotificationItem = {
  id: string;
  type: string;
  group: string;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'normal' | string;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationListParams = {
  includeRead?: boolean;
  limit?: number;
  group?: string;
  priority?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'priority';
};

export type ActivityFeedItem = {
  id: string;
  type: string;
  group: string;
  title: string;
  message: string;
  created_at: string;
};

export async function listNotifications(params: boolean | NotificationListParams = false) {
  const requestParams =
    typeof params === 'boolean'
      ? { include_read: params }
      : {
          include_read: params.includeRead,
          limit: params.limit,
          group: params.group,
          priority: params.priority,
          search: params.search,
          sort: params.sort,
        };
  const response = await api.get<ApiEnvelope<NotificationItem[]>>('/notifications', {
    params: requestParams,
  });
  return response.data.data ?? [];
}

export async function getUnreadNotificationCount() {
  const response = await api.get<ApiEnvelope<{ count: number }>>('/notifications/unread-count');
  return response.data.data?.count ?? 0;
}

export async function markNotificationRead(notificationId?: string) {
  const response = await api.post<ApiEnvelope<{ updated: number }>>('/notifications/mark-read', null, {
    params: notificationId ? { notification_id: notificationId } : undefined,
  });
  return response.data.data ?? { updated: 0 };
}

export async function deleteNotification(notificationId: string) {
  const response = await api.delete<ApiEnvelope<boolean>>(`/notifications/${notificationId}`);
  return response.data.data ?? false;
}

export async function listActivityFeed(limit = 12) {
  const response = await api.get<ApiEnvelope<ActivityFeedItem[]>>('/notifications/activity-feed', {
    params: { limit },
  });
  return response.data.data ?? [];
}
