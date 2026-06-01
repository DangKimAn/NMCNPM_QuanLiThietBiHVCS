import type {
  Device,
  DeviceStatus,
  IncidentReport,
  ReportStatus,
  TransferLog,
} from '../types/manager';

const API_BASE_URL = 'http://localhost:3000/api';

// =======================
// Mapping trạng thái thiết bị
// =======================

const deviceStatusMap: Record<string, DeviceStatus> = {
  GOOD: 'Hoạt động',
  BROKEN: 'Báo hỏng',
  UNDER_REPAIR: 'Đang sửa',
  DISCARDED: 'Thanh lý',
};

const reportStatusMap: Record<string, ReportStatus> = {
  PENDING: 'Mới tiếp nhận',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Từ chối',
};

export const toBackendDeviceStatus = (status: DeviceStatus) => {
  switch (status) {
    case 'Hoạt động':
      return 'GOOD';
    case 'Báo hỏng':
      return 'BROKEN';
    case 'Đang sửa':
      return 'UNDER_REPAIR';
    case 'Bảo trì':
      return 'UNDER_REPAIR';
    case 'Thanh lý':
      return 'DISCARDED';
    default:
      return 'GOOD';
  }
};

export const toBackendReportStatus = (status: ReportStatus) => {
  switch (status) {
    case 'Mới tiếp nhận':
      return 'PENDING';
    case 'Đang xử lý':
      return 'PROCESSING';
    case 'Đã xử lý':
      return 'RESOLVED';
    case 'Từ chối':
      return 'REJECTED';
    default:
      return 'PENDING';
  }
};

// =======================
// Hàm gọi API dùng chung
// =======================

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Nếu upload file bằng FormData thì không set Content-Type
  // Trình duyệt sẽ tự thêm boundary cho multipart/form-data
  if (options?.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
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
// Type dữ liệu backend
// =======================

export interface BackendCategory {
  categoryId: number;
  name: string;
  description?: string | null;
}

export interface BackendRoom {
  roomId: number;
  code: string;
  name: string;
  building?: string | null;
  floor?: number | null;
  capacity?: number | null;
  status?: string;
}

export interface BackendEquipment {
  equipmentId: number;

  // Mã thiết bị riêng, ví dụ: TB000001
  equipmentCode?: string | null;

  name: string;
  unit?: string | null;
  quantity: number;
  status: string;
  description?: string | null;
  category?: BackendCategory | null;
  allocations?: Array<{
    allocationId: number;
    quantity: number;
    room?: BackendRoom | null;
  }>;
}

export interface BackendReport {
  reportId: number;
  reportContent: string;
  status: string;
  reportedAt?: string;
  resolvedAt?: string | null;
  resolutionContent?: string | null;
  result?: string | null;
  reporter?: {
    userId: number;
    username?: string;
    fullName?: string;
    name?: string;
  } | null;
  handler?: {
    userId: number;
    username?: string;
    fullName?: string;
    name?: string;
  } | null;
  room?: BackendRoom | null;
  equipment?: BackendEquipment | null;
}

export interface BackendTransfer {
  transferId: number;
  quantity: number;
  transferredAt: string;
  note?: string | null;
  equipment?: BackendEquipment | null;
  fromRoom?: BackendRoom | null;
  toRoom?: BackendRoom | null;
  executor?: {
    userId: number;
    username?: string;
    fullName?: string;
    name?: string;
  } | null;
}

export interface DashboardOverview {
  equipmentSummary: {
    total: number;
    active: number;
    needHandle: number;
    broken: number;
    repairing: number;
    discarded: number;
  };
  reportSummary: {
    total: number;
    pending: number;
    processing: number;
    resolved: number;
    rejected: number;
  };
  deviceStatusStats: Array<{
    status: string;
    label: string;
    count: number;
  }>;
  roomStats: Array<{
    roomId: number;
    code: string;
    name: string;
    totalQuantity: number;
    activeQuantity: number;
    needHandleQuantity: number;
  }>;
  latestReports: BackendReport[];
  latestTransfers: BackendTransfer[];
}

// =======================
// Chuyển dữ liệu backend sang frontend
// =======================

export const mapEquipmentToDevice = (equipment: BackendEquipment): Device => {
  const firstAllocation = equipment.allocations?.[0];

  return {
    // ID thật trong database, dùng để gọi API sửa/xóa
    equipmentId: equipment.equipmentId,

    // Mã thiết bị hiển thị trên giao diện
    id:
      equipment.equipmentCode ||
      `TB${String(equipment.equipmentId).padStart(6, '0')}`,

    name: equipment.name,
    type: equipment.category?.name || 'Khác',
    room: firstAllocation?.room?.code || 'Kho',

    // Tạm giữ quantity để không lỗi giao diện cũ.
    // Sau bước sửa bảng thiết bị sẽ bỏ cột số lượng.
    quantity: 1,

    status: deviceStatusMap[equipment.status] || 'Hoạt động',
    importDate: '',
    note: equipment.description || '',
  };
};

export const mapReportToIncident = (report: BackendReport): IncidentReport => {
  const reporterName =
    report.reporter?.fullName ||
    report.reporter?.name ||
    report.reporter?.username ||
    'Người gửi';

  const handlerName =
    report.handler?.fullName ||
    report.handler?.name ||
    report.handler?.username ||
    '';

  return {
    id: String(report.reportId),
    sender: reporterName,
    room: report.room?.code || '',
    device: report.equipment?.name || 'Không xác định',
    issue: report.reportContent,
    date: report.reportedAt
      ? report.reportedAt.replace('T', ' ').slice(0, 16)
      : '',
    status: reportStatusMap[report.status] || 'Mới tiếp nhận',
    handlerName,
    handlerNote: report.resolutionContent || report.result || '',
    handledAt: report.resolvedAt
      ? report.resolvedAt.replace('T', ' ').slice(0, 16)
      : undefined,
  };
};

export const mapTransferToLog = (transfer: BackendTransfer): TransferLog => {
  const executorName =
    transfer.executor?.fullName ||
    transfer.executor?.name ||
    transfer.executor?.username ||
    'Cán bộ QLTB';

  return {
    id: String(transfer.transferId),
    deviceId:
      transfer.equipment?.equipmentCode ||
      String(transfer.equipment?.equipmentId || ''),
    deviceName: transfer.equipment?.name || 'Thiết bị',
    fromRoom: transfer.fromRoom?.code || '',
    toRoom: transfer.toRoom?.code || '',
    date: transfer.transferredAt ? transfer.transferredAt.slice(0, 10) : '',
    handler: executorName,
    reason: transfer.note || '',
  };
};

// =======================
// API cho manager
// =======================

export const managerApi = {
  getOverview() {
    return request<DashboardOverview>('/manager-dashboard/overview');
  },

  getRooms() {
    return request<BackendRoom[]>('/rooms');
  },

  getCategories() {
    return request<BackendCategory[]>('/equipment-categories');
  },

  async getDevices(params?: {
    search?: string;
    status?: string;
    roomId?: number;
    categoryId?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.roomId) query.set('roomId', String(params.roomId));
    if (params?.categoryId) query.set('categoryId', String(params.categoryId));

    const url = query.toString()
      ? `/equipments?${query.toString()}`
      : '/equipments';

    const data = await request<BackendEquipment[]>(url);

    return data.map(mapEquipmentToDevice);
  },

  createEquipment(payload: {
    equipmentCode: string;
    name: string;
    categoryId: number;
    unit?: string;
    status: DeviceStatus;
    description?: string;
  }) {
    return request<BackendEquipment>('/equipments', {
      method: 'POST',
      body: JSON.stringify({
        equipmentCode: payload.equipmentCode,
        name: payload.name,
        categoryId: payload.categoryId,
        unit: payload.unit || 'cái',
        status: toBackendDeviceStatus(payload.status),
        description: payload.description,
      }),
    });
  },

  updateEquipment(
    equipmentId: number,
    payload: {
      equipmentCode?: string;
      name?: string;
      categoryId?: number;
      unit?: string;
      status?: DeviceStatus;
      description?: string;
    },
  ) {
    return request<BackendEquipment>(`/equipments/${equipmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        equipmentCode: payload.equipmentCode,
        name: payload.name,
        categoryId: payload.categoryId,
        unit: payload.unit,
        status: payload.status
          ? toBackendDeviceStatus(payload.status)
          : undefined,
        description: payload.description,
      }),
    });
  },

  updateEquipmentStatus(
    equipmentId: number,
    payload: {
      status: DeviceStatus;
      description?: string;
    },
  ) {
    return request<BackendEquipment>(`/equipments/${equipmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: toBackendDeviceStatus(payload.status),
        description: payload.description,
      }),
    });
  },

  deleteEquipment(equipmentId: number) {
    return request<BackendEquipment>(`/equipments/${equipmentId}`, {
      method: 'DELETE',
    });
  },

  importEquipments(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return request<{
      successCount: number;
      failedCount: number;
      errors: { row: number; reason: string }[];
    }>('/equipments/import', {
      method: 'POST',
      body: formData,
    });
  },

  allocateEquipment(payload: {
    equipmentId: number;
    roomId: number;
    quantity: number;
    allocatedAt: string;
    note?: string;
  }) {
    return request('/equipment-allocations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getTransfers() {
    const data = await request<BackendTransfer[]>('/equipment-transfers');
    return data.map(mapTransferToLog);
  },

  createTransfer(payload: {
    equipmentId: number;
    fromRoomId: number;
    toRoomId: number;
    quantity: number;
    transferredAt: string;
    executorId: number;
    note?: string;
  }) {
    return request<BackendTransfer>('/equipment-transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  importTransfers(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    // Endpoint giả định là '/equipment-transfers/import' 
    // Bạn có thể sửa lại route này nếu Backend quy định khác đi một chút
    return request<{
      successCount: number;
      failedCount: number;
      errors: { row: number; reason: string }[];
    }>('/equipment-transfers/import', {
      method: 'POST',
      body: formData,
    });
  },

  async getReports(params?: {
    status?: string;
    roomId?: number;
    equipmentId?: number;
    search?: string;
  }) {
    const query = new URLSearchParams();

    if (params?.status) query.set('status', params.status);
    if (params?.roomId) query.set('roomId', String(params.roomId));
    if (params?.equipmentId) {
      query.set('equipmentId', String(params.equipmentId));
    }
    if (params?.search) query.set('search', params.search);

    const url = query.toString() ? `/reports?${query.toString()}` : '/reports';
    const data = await request<BackendReport[]>(url);

    return data.map(mapReportToIncident);
  },

  handleReport(
    reportId: string,
    payload: {
      status: ReportStatus;
      handlerId: number;
      resolutionContent?: string;
      result?: string;
    },
  ) {
    return request<BackendReport>(`/reports/${reportId}/handle`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: toBackendReportStatus(payload.status),
        handlerId: payload.handlerId,
        resolutionContent: payload.resolutionContent,
        result: payload.result,
      }),
    });
  },
};