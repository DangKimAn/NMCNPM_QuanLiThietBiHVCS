// Component hiển thị bảng danh sách thiết bị.
// Nhận dữ liệu từ DeviceManager và gọi lại các hàm xử lý khi người dùng bấm nút thao tác.

import { FiActivity, FiEdit2, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

import type { Device } from '../../../types/manager';
import { StatusBadge, TableHead } from '../common/ManagerCommon';

interface DeviceTableProps {
  devices: Device[]; // Danh sách thiết bị cần hiển thị
  onEdit: (device: Device) => void; // Hàm mở form sửa thiết bị
  onDelete: (device: Device) => void; // Hàm xóa thiết bị
  onStatus: (device: Device) => void; // Hàm mở modal cập nhật trạng thái
  onTransfer: (device: Device) => void; // Hàm mở modal điều chuyển
}

export const DeviceTable = ({
  devices,
  onEdit,
  onDelete,
  onStatus,
  onTransfer,
}: DeviceTableProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Bảng danh sách thiết bị */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <TableHead>Mã TB</TableHead>
              <TableHead>Tên thiết bị</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead alignRight>Thao tác</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {devices.map((device) => (
              <tr key={device.equipmentId} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-bold text-slate-800">
                  {device.id}
                </td>

                <td className="px-6 py-4 text-sm">
                  <p className="font-semibold text-slate-800">{device.name}</p>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Ngày nhập: {device.importDate || 'Chưa cập nhật'}
                  </p>

                  {device.note && (
                    <p
                      className="text-xs text-slate-500 mt-1 max-w-xs truncate"
                      title={device.note}
                    >
                      {device.note}
                    </p>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {device.type}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    {device.room}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={device.status} type="device" />
                </td>

                <td className="px-6 py-4 text-sm">
                  {/* Các nút thao tác: cập nhật trạng thái, điều chuyển, sửa, xóa */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onStatus(device)}
                      className="text-slate-400 hover:text-amber-600"
                      title="Cập nhật trạng thái"
                    >
                      <FiActivity className="text-lg" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onTransfer(device)}
                      className="text-slate-400 hover:text-indigo-600"
                      title="Điều chuyển thiết bị"
                    >
                      <FiRefreshCw className="text-lg" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(device)}
                      className="text-slate-400 hover:text-blue-600"
                      title="Sửa thiết bị"
                    >
                      <FiEdit2 className="text-lg" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(device)}
                      className="text-slate-400 hover:text-rose-600"
                      title="Xóa thiết bị"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Hiển thị khi không có thiết bị nào phù hợp với bộ lọc */}
            {devices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  Không tìm thấy thiết bị phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
        Hiển thị {devices.length} thiết bị
      </div>
    </div>
  );
};