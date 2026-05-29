// File này định nghĩa các kiểu dữ liệu dùng chung cho phần Cán bộ quản lý thiết bị.
// Mục đích: giúp TypeScript kiểm tra dữ liệu thiết bị, điều chuyển và phản ánh báo hỏng.

// Các trạng thái hợp lệ của thiết bị
export type DeviceStatus =
  | 'Hoạt động'
  | 'Báo hỏng'
  | 'Đang sửa'
  | 'Bảo trì'
  | 'Thanh lý';

// Kiểu dữ liệu của một thiết bị trong hệ thống
export interface Device {
  // ID thật trong database, dùng để gọi API sửa/xóa/cập nhật trạng thái
  equipmentId: number;

  // Mã thiết bị hiển thị trên giao diện, ví dụ: TB000001
  id: string;

  name: string; // Tên thiết bị
  type: string; // Loại thiết bị: Trình chiếu, Âm thanh, Điện lạnh...
  room: string; // Phòng đang sử dụng thiết bị

  // Tạm thời vẫn giữ quantity để tránh lỗi các component cũ.
  // Sau bước sửa giao diện bảng/form, mình sẽ bỏ cột số lượng khỏi phần thêm thiết bị.
  quantity: number;

  status: DeviceStatus; // Trạng thái hiện tại của thiết bị
  importDate: string; // Ngày nhập thiết bị
  note: string; // Ghi chú thêm
}

// Kiểu dữ liệu lịch sử điều chuyển thiết bị
export interface TransferLog {
  id: string; // Mã phiếu điều chuyển
  deviceId: string; // Mã thiết bị được điều chuyển
  deviceName: string; // Tên thiết bị được điều chuyển
  fromRoom: string; // Phòng cũ
  toRoom: string; // Phòng mới
  date: string; // Ngày điều chuyển
  handler: string; // Người thực hiện điều chuyển
  reason: string; // Lý do điều chuyển
}

// Các trạng thái xử lý phản ánh báo hỏng
export type ReportStatus =
  | 'Mới tiếp nhận'
  | 'Đang xử lý'
  | 'Đã xử lý'
  | 'Từ chối';

// Kiểu dữ liệu của một phản ánh sự cố
export interface IncidentReport {
  id: string; // Mã phản ánh
  sender: string; // Người gửi phản ánh
  room: string; // Phòng học xảy ra sự cố
  device: string; // Thiết bị liên quan
  issue: string; // Nội dung sự cố
  date: string; // Thời gian gửi phản ánh
  status: ReportStatus; // Trạng thái xử lý phản ánh
  handlerName?: string; // Người xử lý phản ánh
  handlerNote?: string; // Ghi chú xử lý
  handledAt?: string; // Thời gian cập nhật xử lý
}