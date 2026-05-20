import type { ReportStatus } from '../types/manager';

export interface StudentUser {
  userId: number;
  fullName: string;
  username: string;
  role: string;
}

export interface StudentRoomOption {
  roomId: number;
  code: string;
  name: string;
}

export interface StudentEquipmentOption {
  equipmentId: number;
  name: string;
  status: string;
  roomId: number;
  roomCode: string;
}

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

const REPORT_STORAGE_KEY = 'mock_student_reports';

export const mockRooms: StudentRoomOption[] = [
  {
    roomId: 1,
    code: 'A101',
    name: 'Phòng học A101',
  },
  {
    roomId: 2,
    code: 'A102',
    name: 'Phòng học A102',
  },
  {
    roomId: 3,
    code: 'B201',
    name: 'Phòng thực hành B201',
  },
];

export const mockEquipments: StudentEquipmentOption[] = [
  {
    equipmentId: 1,
    name: 'Máy chiếu Epson',
    status: 'Hoạt động',
    roomId: 1,
    roomCode: 'A101',
  },
  {
    equipmentId: 2,
    name: 'Loa phòng học',
    status: 'Hoạt động',
    roomId: 1,
    roomCode: 'A101',
  },
  {
    equipmentId: 3,
    name: 'Máy lạnh Daikin',
    status: 'Hoạt động',
    roomId: 2,
    roomCode: 'A102',
  },
  {
    equipmentId: 4,
    name: 'Máy tính giảng viên',
    status: 'Hoạt động',
    roomId: 3,
    roomCode: 'B201',
  },
];

export const getCurrentStudentUser = (): StudentUser => {
  const rawUser =
    localStorage.getItem('currentUser') ||
    localStorage.getItem('user') ||
    localStorage.getItem('authUser');

  if (!rawUser) {
    return {
      userId: 1,
      fullName: 'Người dùng',
      username: 'student',
      role: 'Sinh viên/Giảng viên',
    };
  }

  try {
    const user = JSON.parse(rawUser);

    return {
      userId: Number(user.userId || user.id || 1),
      fullName:
        user.fullName ||
        user.name ||
        user.hoTen ||
        user.hoten ||
        user.displayName ||
        'Người dùng',
      username:
        user.username ||
        user.userName ||
        user.taiKhoan ||
        user.tenDangNhap ||
        user.email ||
        'student',
      role: user.role || user.roleName || 'Sinh viên/Giảng viên',
    };
  } catch {
    return {
      userId: 1,
      fullName: 'Người dùng',
      username: 'student',
      role: 'Sinh viên/Giảng viên',
    };
  }
};

const getNowText = () => {
  const now = new Date();

  const date = now.toLocaleDateString('vi-VN');

  const time = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date} ${time}`;
};

const createInitialReports = (): StudentReportItem[] => [
  {
    id: '1',
    reporterId: 1,
    roomId: 1,
    equipmentId: 1,
    room: 'A101',
    device: 'Máy chiếu Epson',
    issue: 'Máy chiếu lên hình chập chờn, đôi lúc bị mất tín hiệu.',
    status: 'Mới tiếp nhận',
    date: '10/05/2026 08:30',
    handlerNote: '',
    handledAt: '',
  },
  {
    id: '2',
    reporterId: 1,
    roomId: 2,
    equipmentId: 3,
    room: 'A102',
    device: 'Máy lạnh Daikin',
    issue: 'Máy lạnh hoạt động yếu, phòng không đủ mát.',
    status: 'Đang xử lý',
    date: '10/05/2026 09:15',
    handlerNote: 'Cán bộ kỹ thuật đã tiếp nhận và đang kiểm tra.',
    handledAt: '',
  },
];

export const readStudentReports = (): StudentReportItem[] => {
  const raw = localStorage.getItem(REPORT_STORAGE_KEY);

  if (!raw) {
    const initialReports = createInitialReports();
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(initialReports));
    return initialReports;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return createInitialReports();
  }
};

export const saveStudentReports = (reports: StudentReportItem[]) => {
  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports));
};

export const getMyReports = (userId: number) => {
  return readStudentReports().filter((report) => report.reporterId === userId);
};

export const createStudentReport = (payload: {
  reporterId: number;
  roomId: number;
  equipmentId: number;
  reportContent: string;
}) => {
  const reports = readStudentReports();

  const room = mockRooms.find((item) => item.roomId === payload.roomId);

  const equipment = mockEquipments.find(
    (item) => item.equipmentId === payload.equipmentId,
  );

  const newReport: StudentReportItem = {
    id:
      reports.length > 0
        ? String(Math.max(...reports.map((report) => Number(report.id))) + 1)
        : '1',
    reporterId: payload.reporterId,
    roomId: payload.roomId,
    equipmentId: payload.equipmentId,
    room: room?.code || '',
    device: equipment?.name || 'Không xác định',
    issue: payload.reportContent,
    status: 'Mới tiếp nhận',
    date: getNowText(),
    handlerNote: '',
    handledAt: '',
  };

  const nextReports = [newReport, ...reports];
  saveStudentReports(nextReports);

  return newReport;
};