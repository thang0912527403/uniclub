export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export interface CreateNotificationRequest {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  userId: string;
}
