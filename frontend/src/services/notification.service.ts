import apiClient from '../api/client';

export type NotificationType = 'FOLLOW' | 'FOLLOW_REQUEST' | 'POST_REACTION' | 'COMMENT' | 'COMMENT_REPLY' | 'COMMUNITY_KICK' | 'COMMUNITY_BAN';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

const NotificationService = {
  /** GET /notifications */
  async getAll(): Promise<NotificationResponse[]> {
    return apiClient.get<NotificationResponse[]>('/notifications');
  },

  /** GET /notifications/unread-count */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/notifications/unread-count');
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(id: string): Promise<{ success: boolean }> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  /** PATCH /notifications/read-all */
  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient.patch('/notifications/read-all');
  },
};

export default NotificationService;
