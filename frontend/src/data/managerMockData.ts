// File này chứa dữ liệu mẫu cho frontend.
// Hiện tại chưa kết nối backend nên dùng mock data để mô phỏng dữ liệu thật.

import type {
  Device,
  DeviceStatus,
  IncidentReport,
  ReportStatus,
  TransferLog,
} from '../types/manager';

// Danh sách phòng học mẫu
export const rooms = ['A201', 'A202', 'B105', 'C301', 'Kho'];

// Danh sách loại thiết bị mẫu
export const deviceTypes = ['Trình chiếu', 'Âm thanh', 'Điện lạnh', 'Phụ kiện', 'Mạng', 'Khác'];

// Danh sách trạng thái thiết bị
export const deviceStatuses: DeviceStatus[] = [
  'Hoạt động',
  'Báo hỏng',
  'Đang sửa',
  'Bảo trì',
  'Thanh lý',
];

// Danh sách trạng thái xử lý phản ánh
export const reportStatuses: ReportStatus[] = [
  'Mới tiếp nhận',
  'Đang xử lý',
  'Đã xử lý',
  'Từ chối',
];

// Dữ liệu mẫu danh sách thiết bị
export const initialDevices: Device[] = [
  {
    id: 'TB001',
    name: 'Máy chiếu Panasonic PT-LB303',
    type: 'Trình chiếu',
    room: 'A201',
    quantity: 1,
    status: 'Hoạt động',
    importDate: '2025-09-10',
    note: 'Sử dụng ổn định.',
  },
  {
    id: 'TB002',
    name: 'Micro không dây Shure',
    type: 'Âm thanh',
    room: 'A201',
    quantity: 2,
    status: 'Hoạt động',
    importDate: '2025-09-12',
    note: 'Có 2 tay micro.',
  },
  {
    id: 'TB003',
    name: 'Dây cáp chuyển đổi HDMI',
    type: 'Phụ kiện',
    room: 'A202',
    quantity: 1,
    status: 'Báo hỏng',
    importDate: '2025-10-05',
    note: 'Đầu chuyển chập chờn, chờ thay mới.',
  },
  {
    id: 'TB004',
    name: 'Điều hòa Daikin 18000BTU',
    type: 'Điện lạnh',
    room: 'B105',
    quantity: 1,
    status: 'Đang sửa',
    importDate: '2024-08-20',
    note: 'Đã gửi đội kỹ thuật kiểm tra.',
  },
];

// Dữ liệu mẫu lịch sử điều chuyển thiết bị
export const initialTransfers: TransferLog[] = [
  {
    id: 'DC001',
    deviceId: 'TB003',
    deviceName: 'Dây cáp chuyển đổi HDMI',
    fromRoom: 'A201',
    toRoom: 'A202',
    date: '2026-05-02',
    handler: 'Cán bộ QLTB',
    reason: 'Bổ sung thiết bị trình chiếu cho phòng A202.',
  },
];

// Dữ liệu mẫu phản ánh báo hỏng
export const initialReports: IncidentReport[] = [
  {
    id: 'PA001',
    sender: 'SV001 - Phạm Văn D',
    room: 'A201',
    device: 'Máy chiếu Panasonic',
    issue: 'Máy chiếu cắm điện không lên đèn, có mùi khét.',
    date: '2026-05-04 08:15',
    status: 'Mới tiếp nhận',
  },
  {
    id: 'PA002',
    sender: 'GV001 - Lê Văn C',
    room: 'B105',
    device: 'Điều hòa Daikin',
    issue: 'Điều hòa không mát, bị chảy nước xuống bàn.',
    date: '2026-05-03 14:20',
    status: 'Đang xử lý',
    handlerName: 'Cán bộ QLTB',
    handlerNote: 'Đã liên hệ kỹ thuật kiểm tra gas và đường nước.',
    handledAt: '2026-05-03 15:10',
  },
  {
    id: 'PA003',
    sender: 'SV005 - Trần Thị E',
    room: 'A202',
    device: 'Dây cáp HDMI',
    issue: 'Mất đầu chuyển type-C sang HDMI tại bàn giáo viên.',
    date: '2026-05-01 09:30',
    status: 'Đã xử lý',
    handlerName: 'Cán bộ QLTB',
    handlerNote: 'Đã cấp lại đầu chuyển HDMI mới.',
    handledAt: '2026-05-01 10:25',
  },
];