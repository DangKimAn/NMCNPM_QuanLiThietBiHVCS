// Component hiển thị thiết bị theo từng phòng học.
// Mỗi phòng là một card riêng, bên trong có danh sách thiết bị thuộc phòng đó.

import { FiActivity, FiRefreshCw } from 'react-icons/fi';

import type { Device } from '../../../types/manager';
import { StatusBadge } from '../common/ManagerCommon';

interface DeviceRoomCardsProps {
  rooms: string[]; // Danh sách phòng học
  devices: Device[]; // Danh sách toàn bộ thiết bị
  onStatus: (device: Device) => void; // Hàm mở modal cập nhật trạng thái
  onTransfer: (device: Device) => void; // Hàm mở modal điều chuyển
}

export const DeviceRoomCards = ({
  rooms,
  devices,
  onStatus,
  onTransfer,
}: DeviceRoomCardsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {rooms.map((room) => {
        // Lấy danh sách thiết bị thuộc phòng hiện tại
        const roomDevices = devices.filter((device) => device.room === room);

        // Đếm số thiết bị đang hoạt động trong phòng
        const activeCount = roomDevices.filter((device) => device.status === 'Hoạt động').length;

        // Đếm số thiết bị không hoạt động bình thường
        const needFixCount = roomDevices.filter((device) => device.status !== 'Hoạt động').length;

        return (
          <div key={room} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Card thông tin của từng phòng học */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Phòng {room}</h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  {activeCount}/{roomDevices.length} thiết bị hoạt động
                </p>
              </div>

              <span className="text-xs font-semibold bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                Cần xử lý: {needFixCount}
              </span>
            </div>

            <div className="p-5">
              {roomDevices.length > 0 ? (
                // Danh sách thiết bị trong phòng
                <ul className="space-y-4">
                  {roomDevices.map((device) => (
                    <li
                      key={device.id}
                      className="flex justify-between gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{device.name}</p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {device.id} • {device.type} • SL: {device.quantity}
                        </p>

                        <div className="mt-2">
                          <StatusBadge status={device.status} type="device" />
                        </div>
                      </div>

                      {/* Nút cập nhật trạng thái và điều chuyển nhanh */}
                      <div className="flex gap-2 mt-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onStatus(device)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="Cập nhật trạng thái"
                        >
                          <FiActivity className="text-sm" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onTransfer(device)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Điều chuyển"
                        >
                          <FiRefreshCw className="text-sm" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  Phòng này chưa có thiết bị.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};