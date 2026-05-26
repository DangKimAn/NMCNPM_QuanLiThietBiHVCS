const API_BASE_URL = 'http://localhost:3000/api';

// =======================
// Helper: lấy access token từ localStorage
// =======================
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// =======================
// Hàm gọi API dùng chung
// =======================
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Có lỗi xảy ra khi gọi API');
  }

  return response.json() as Promise<T>;
}

// =======================
// Types backend
// =======================

export interface BackendUser {
  userId: number;
  username: string;
  email: string;
  phoneNumber: string | null;
  roleId: number;
  role: string;        // tên vai trò (roleName)
  status: string;      // ACTIVE | LOCKED | ...
}

export interface BackendRole {
  roleId: number;
  roleName: string;
  description?: string | null;
  permissions?: BackendPermission[];
}

export interface BackendPermission {
  permissionId: number;
  permissionName: string;
  description?: string | null;
}

export interface BackendAuditLog {
  logId: number;
  userId: number;
  action: string;
  target: string;
  targetId: number;
  method: string | null;
  route: string | null;
  statusCode: number | null;
  responseMessage: string | null;
  content: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isMarked: boolean;
  createdAt: string;
  user?: {
    userId: number;
    username: string;
  };
}

export interface AuditLogResponse {
  logs: BackendAuditLog[];
  total: number;
  page: number;
  limit: number;
}

// =======================
// Mapping trạng thái user
// =======================
export const USER_STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
  INACTIVE: 'Đã khóa',
};

export const toBackendStatus = (status: string): string => {
  if (status === 'Hoạt động') return 'ACTIVE';
  if (status === 'Đã khóa') return 'LOCKED';
  return status;
};

// =======================
// Frontend User type
// =======================
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  phoneNumber?: string | null;
  userId: number;
  roleId: number;
}

export const mapBackendUser = (u: BackendUser): AdminUser => ({
  id: String(u.userId),
  username: u.username,
  email: u.email ?? '',
  fullName: u.username, // backend chưa có fullName riêng, dùng username tạm
  role: u.role ?? '',
  status: USER_STATUS_MAP[u.status] ?? u.status,
  phoneNumber: u.phoneNumber,
  userId: u.userId,
  roleId: u.roleId,
});

// =======================
// API
// =======================

export const adminApi = {
  // --- USERS ---

  /** Lấy toàn bộ danh sách user (chỉ ADMIN) */
  async getUsers(keyword?: string): Promise<AdminUser[]> {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    const data = await request<BackendUser[]>(`/user${query}`);
    return data.map(mapBackendUser);
  },

  /** Tìm kiếm user theo username */
  async searchUserByUsername(username: string): Promise<AdminUser> {
    const data = await request<BackendUser>(`/user/getUserbyUsername/${encodeURIComponent(username)}`);
    return mapBackendUser(data);
  },

  /** Tạo user mới (chỉ ADMIN) */
  createUser(payload: {
    email: string;
    username: string;
    password: string;
    phoneNumber?: string;
    roleId?: number;
  }) {
    return request<BackendUser>('/user', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Cập nhật thông tin user */
  updateUser(
    userId: number,
    payload: {
      password?: string;
      phoneNumber?: string;
      status?: string;   // 'ACTIVE' | 'LOCKED'
      roleId?: number;
    },
  ) {
    return request<BackendUser>(`/user/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /** Thay đổi role của user (chỉ ADMIN) */
  changeUserRole(userId: number, roleName: string) {
    return request<BackendUser>(`/user/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleName }),
    });
  },

  /** Xóa user (chỉ ADMIN) */
  deleteUser(userId: number) {
    return request<{ message: string }>(`/user/${userId}`, {
      method: 'DELETE',
    });
  },

  // --- ROLES ---

  /** Lấy toàn bộ danh sách role */
  getRoles() {
    return request<BackendRole[]>('/role');
  },

  /** Tạo role mới */
  createRole(payload: { roleName: string; description?: string }) {
    return request<BackendRole>('/role', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Cập nhật role */
  updateRole(roleId: number, payload: { roleName?: string; description?: string }) {
    return request<BackendRole>(`/role/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /** Xóa role */
  deleteRole(roleId: number) {
    return request<{ message: string }>(`/role/${roleId}`, {
      method: 'DELETE',
    });
  },

  /** Gán quyền cho role */
  addPermissionToRole(roleId: number, permissionId: number) {
    return request(`/role/createRolePermission/${roleId}`, {
      method: 'POST',
      body: JSON.stringify({ permissionId }),
    });
  },

  // --- PERMISSIONS ---

  /** Lấy toàn bộ danh sách quyền */
  getPermissions() {
    return request<BackendPermission[]>('/permission');
  },

  /** Tạo quyền mới */
  createPermission(payload: { permissionName: string; description?: string }) {
    return request<BackendPermission>('/permission', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Cập nhật quyền */
  updatePermission(permissionId: number, payload: { permissionName?: string; description?: string }) {
    return request<BackendPermission>(`/permission/${permissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /** Xóa quyền */
  deletePermission(permissionId: number) {
    return request<{ message: string }>(`/permission/${permissionId}`, {
      method: 'DELETE',
    });
  },

  // --- AUDIT LOGS ---

  /** Lấy nhật ký hệ thống (chỉ ADMIN) */
  getAuditLogs(params?: {
    limit?: number;
    page?: number;
    username?: string;
    from?: string;
    to?: string;
  }): Promise<AuditLogResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));
    if (params?.username) query.set('username', params.username);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const url = query.toString() ? `/audit-log?${query.toString()}` : '/audit-log';
    return request<AuditLogResponse>(url);
  },

  /** Đánh dấu/bỏ đánh dấu nhật ký */
  markAuditLog(logId: number, isMarked: boolean) {
    return request(`/audit-log/${logId}/mark`, {
      method: 'PATCH',
      body: JSON.stringify({ isMarked }),
    });
  },
};