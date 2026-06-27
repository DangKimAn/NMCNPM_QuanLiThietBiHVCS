import type { ReportStatus } from '../types/manager';

import { API_BASE_URL } from '../config/env';

// ─── Helper ────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: { ...getAuthHeaders(), ...(options?.headers || {}) },
    ...options,
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Có lỗi xảy ra khi gọi API');
  }

  return res.json() as Promise<T>;
}

// ─── Backend types ──────────────────────────────────────────────────────────

export interface BackendRoom {
  roomId: number;
  code: string;
  name: string;
  building?: string | null;
  floor?: number | null;
  status?: string;
}

export interface BackendEquipment {
  equipmentId: number;
  equipmentCode: string;
  name: string;
  status: string;
  description?: string | null;
  category?: { categoryId: number; name: string } | null;
  allocations?: Array<{
    allocationId: number;
    quantity: number;
    room?: BackendRoom | null;
  }>;
}

export interface BackendReport {
  reportId: number;
  reportContent: string;
  status: string;   // PENDING | PROCESSING | RESOLVED | REJECTED
  reportedAt?: string;
  resolvedAt?: string | null;
  resolutionContent?: string | null;
  result?: string | null;
  reporter?: { userId: number; username?: string } | null;
  handler?: { userId: number; username?: string } | null;
  room?: BackendRoom | null;
  equipment?: BackendEquipment | null;
}

// ─── Mapping ────────────────────────────────────────────────────────────────

const reportStatusMap: Record<string, ReportStatus> = {
  PENDING: 'Mới tiếp nhận',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Từ chối',
};

export interface StudentReportItem {
  id: string;
  reporterId: number;
  roomId: number;
  equipmentId: number;
  room: string;
  device: string;
  issue: string;
  status: ReportStatus;
  date: string;
  handlerNote?: string;
  handledAt?: string;
}

export interface StudentRoomOption {
  roomId: number;
  code: string;
  name: string;
  building: string | null;
}

export interface StudentEquipmentOption {
  equipmentId: number;
  equipmentCode: string;
  name: string;
  status: string;
  roomId: number;
  roomCode: string;
}

function mapReport(r: BackendReport): StudentReportItem {
  return {
    id: String(r.reportId),
    reporterId: r.reporter?.userId ?? 0,
    roomId: r.room?.roomId ?? 0,
    equipmentId: r.equipment?.equipmentId ?? 0,
    room: r.room?.code ?? '',
    device: r.equipment ? `${r.equipment.name} - ${r.equipment.equipmentCode || `TB${String(r.equipment.equipmentId).padStart(6, '0')}`}` : 'Không xác định',
    issue: r.reportContent,
    status: reportStatusMap[r.status] ?? 'Mới tiếp nhận',
    date: r.reportedAt ? r.reportedAt.replace('T', ' ').slice(0, 16) : '',
    handlerNote: r.resolutionContent ?? r.result ?? '',
    handledAt: r.resolvedAt ? r.resolvedAt.replace('T', ' ').slice(0, 16) : '',
  };
}

export interface StudentRoomEquipment {
  roomId: number;
  code: string;
  name: string;
  building: string | null;
  floor: number | null;
  status: string;
  equipments: Array<{
    equipmentId: number;
    name: string;
    equipmentCode: string | null;
    quantity: number;
    status: string;
    category: string;
  }>;
}

// ─── API ────────────────────────────────────────────────────────────────────

export const studentApi = {
  /** Lấy danh sách phòng học */
  async getRooms(): Promise<StudentRoomOption[]> {
    const data = await request<BackendRoom[]>('/rooms');
    return data.map((r) => ({ roomId: r.roomId, code: r.code, name: r.name, building: r.building ?? null }));
  },

  /** Lấy danh sách phòng kèm thiết bị */
  async getRoomsWithEquipments(): Promise<StudentRoomEquipment[]> {
    const data = await request<any[]>('/rooms');
    return data.map((r: any) => ({
      roomId: r.roomId,
      code: r.code,
      name: r.name,
      building: r.building ?? null,
      floor: r.floor ?? null,
      status: r.status === 'AVAILABLE' ? 'Hoạt động' : 'Không hoạt động',
      equipments: (r.allocations || []).map((alloc: any) => ({
        equipmentId: alloc.equipment.equipmentId,
        name: alloc.equipment.name,
        equipmentCode: alloc.equipment.equipmentCode ?? null,
        quantity: alloc.quantity,
        status: alloc.equipment.status === 'GOOD' ? 'Hoạt động'
          : alloc.equipment.status === 'BROKEN' ? 'Báo hỏng'
            : alloc.equipment.status === 'UNDER_REPAIR' ? 'Đang sửa'
              : 'Thanh lý',
        category: alloc.equipment.category?.name ?? 'Khác',
      })),
    }));
  },

  /** Lấy danh sách thiết bị (có allocation theo phòng) */
  async getEquipments(): Promise<StudentEquipmentOption[]> {
    const data = await request<BackendEquipment[]>('/equipments');
    const result: StudentEquipmentOption[] = [];

    for (const eq of data) {
      if (eq.allocations && eq.allocations.length > 0) {
        // Mỗi allocation = 1 phòng chứa thiết bị này
        for (const alloc of eq.allocations) {
          if (alloc.room) {
            result.push({
              equipmentId: eq.equipmentId,
              equipmentCode: eq.equipmentCode || 'N/A',
              name: eq.name,
              status: eq.status === 'GOOD' ? 'Hoạt động'
                : eq.status === 'BROKEN' ? 'Hỏng'
                  : eq.status === 'UNDER_REPAIR' ? 'Đang sửa'
                    : 'Thanh lý',
              roomId: alloc.room.roomId,
              roomCode: alloc.room.code,
            });
          }
        }
      } else {
        // Thiết bị chưa phân phối phòng — vẫn liệt kê
        result.push({
          equipmentId: eq.equipmentId,
          equipmentCode: eq.equipmentCode || 'N/A',
          name: eq.name,
          status: 'Hoạt động',
          roomId: 0,
          roomCode: 'Kho',
        });
      }
    }

    return result;
  },

  /** Lấy phản ánh của người dùng hiện tại */
  async getMyReports(): Promise<StudentReportItem[]> {
    const data = await request<BackendReport[]>('/reports?myReports=true');
    return data.map(mapReport);
  },

  /** Gửi phản ánh mới */
  async createReport(payload: {
    roomId: number;
    equipmentId?: number;
    reportContent: string;
    reporterId: number;
  }): Promise<StudentReportItem> {
    const data = await request<BackendReport>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapReport(data);
  },
};