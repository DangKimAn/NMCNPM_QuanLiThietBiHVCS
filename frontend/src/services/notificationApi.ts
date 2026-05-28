import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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

const getAccessToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

const getAuthHeader = () => {
  const token = getAccessToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// Khi accessToken hết hạn, gọi API refresh để lấy token mới
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const newAccessToken = response.data?.accessToken;
    const newRefreshToken = response.data?.refreshToken;

    if (!newAccessToken) {
      return null;
    }

    localStorage.setItem('accessToken', newAccessToken);

    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return newAccessToken;
  } catch (error) {
    console.error('Không thể làm mới token:', error);
    return null;
  }
};

// Hàm request dùng chung.
// Nếu bị 401 thì thử refresh token 1 lần rồi gọi lại request.
const requestWithAuth = async <T>(
  method: 'get' | 'post' | 'delete',
  url: string,
  data?: unknown,
): Promise<T> => {
  try {
    const response =
      method === 'get'
        ? await axios.get<T>(`${API_BASE_URL}${url}`, {
            headers: getAuthHeader(),
          })
        : method === 'post'
          ? await axios.post<T>(`${API_BASE_URL}${url}`, data ?? {}, {
              headers: getAuthHeader(),
            })
          : await axios.delete<T>(`${API_BASE_URL}${url}`, {
              headers: getAuthHeader(),
            });

    return response.data;
  } catch (error: any) {
    if (error?.response?.status !== 401) {
      throw error;
    }

    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');

      window.location.href = '/login';
      throw error;
    }

    const response =
      method === 'get'
        ? await axios.get<T>(`${API_BASE_URL}${url}`, {
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          })
        : method === 'post'
          ? await axios.post<T>(`${API_BASE_URL}${url}`, data ?? {}, {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            })
          : await axios.delete<T>(`${API_BASE_URL}${url}`, {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            });

    return response.data;
  }
};

// Lấy danh sách thông báo của user hiện tại
export const getMyNotifications = async (): Promise<NotificationItem[]> => {
  return requestWithAuth<NotificationItem[]>('get', '/notifications');
};

// Đếm số thông báo chưa đọc
export const getUnreadNotificationCount =
  async (): Promise<UnreadCountResponse> => {
    return requestWithAuth<UnreadCountResponse>(
      'get',
      '/notifications/unread-count',
    );
  };

// MANAGER tạo thông báo mới
export const createNotification = async (
  payload: CreateNotificationPayload,
): Promise<NotificationItem> => {
  return requestWithAuth<NotificationItem>(
    'post',
    '/notifications',
    payload,
  );
};

// Đánh dấu 1 thông báo là đã đọc
export const markNotificationAsRead = async (
  notificationId: number,
): Promise<void> => {
  await requestWithAuth<void>(
    'post',
    `/notifications/${notificationId}/read`,
  );
};

// Đánh dấu tất cả thông báo là đã đọc
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await requestWithAuth<void>('post', '/notifications/read-all');
};

// MANAGER xóa thông báo do mình tạo
export const deleteNotification = async (
  notificationId: number,
): Promise<void> => {
  await requestWithAuth<void>('delete', `/notifications/${notificationId}`);
};