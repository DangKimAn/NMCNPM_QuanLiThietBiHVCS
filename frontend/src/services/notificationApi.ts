import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token');

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export type NotificationTargetRole =
  | 'ALL'
  | 'ADMIN'
  | 'MANAGER'
  | 'TEACHER'
  | 'STUDENT';

export interface NotificationSender {
  userId: number;
  username: string;
  fullName?: string | null;
  email: string;
}

export interface NotificationItem {
  notificationId: number;
  title: string;
  content: string;
  targetRole: NotificationTargetRole;
  createdAt: string;
  updatedAt: string;
  sender: NotificationSender;
  isRead: boolean;
  readAt?: string | null;
}

export interface CreateNotificationPayload {
  title: string;
  content: string;
  targetRole: NotificationTargetRole;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Lấy danh sách thông báo của user hiện tại
export const getMyNotifications = async (): Promise<NotificationItem[]> => {
  const response = await axios.get<NotificationItem[]>(
    `${API_BASE_URL}/notifications`,
    {
      headers: getAuthHeader(),
    },
  );

  return response.data;
};

// Đếm số thông báo chưa đọc
export const getUnreadNotificationCount =
  async (): Promise<UnreadCountResponse> => {
    const response = await axios.get<UnreadCountResponse>(
      `${API_BASE_URL}/notifications/unread-count`,
      {
        headers: getAuthHeader(),
      },
    );

    return response.data;
  };

// MANAGER tạo thông báo mới
export const createNotification = async (
  payload: CreateNotificationPayload,
): Promise<NotificationItem> => {
  const response = await axios.post<NotificationItem>(
    `${API_BASE_URL}/notifications`,
    payload,
    {
      headers: getAuthHeader(),
    },
  );

  return response.data;
};

// Đánh dấu 1 thông báo là đã đọc
export const markNotificationAsRead = async (
  notificationId: number,
): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {},
    {
      headers: getAuthHeader(),
    },
  );
};

// Đánh dấu tất cả thông báo là đã đọc
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}/notifications/read-all`,
    {},
    {
      headers: getAuthHeader(),
    },
  );
};

// MANAGER xóa thông báo do mình tạo
export const deleteNotification = async (
  notificationId: number,
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
    headers: getAuthHeader(),
  });
};