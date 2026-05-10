import { apiClient } from './apiClient';

export interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  data: any;
}

export const getNotifications = async () => {
  return apiClient('/notifications', { method: 'GET', withAuth: true });
};

export const markAsRead = async (id: string) => {
  return apiClient(`/notifications/${id}/read`, { method: 'PUT', withAuth: true });
};

export const markAllAsRead = async () => {
  return apiClient('/notifications/read-all', { method: 'PUT', withAuth: true });
};

export const getUnreadCount = async () => {
  return apiClient('/notifications/unread-count', { method: 'GET', withAuth: true });
};
