import { memo } from 'react';
import { FiActivity, FiEdit2, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import type { Device } from '../../../types/manager';
import { StatusBadge } from '../common/ManagerCommon';

interface DeviceListProps {
  devices: Device[];
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onStatus: (device: Device) => void;
  onTransfer: (device: Device) => void;
}

export const DeviceList = memo(({
  devices,
  onEdit,
  onDelete,
  onStatus,
  onTransfer,
}: DeviceListProps) => {
  if (devices.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-500">
        Không tìm thấy thiết bị phù hợp.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <div
          key={device.equipmentId}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
            {device.id?.slice(0, 2) || 'TB'}
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 items-center">
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate">{device.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">{device.id}</p>
            </div>

            <div className="hidden md:block text-sm text-slate-600 truncate">
              {device.type}
            </div>

            <div>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 whitespace-nowrap">
                {device.room}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={device.status} type="device" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(device)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Sửa"
            >
              <FiEdit2 className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => onStatus(device)}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
              title="Cập nhật trạng thái"
            >
              <FiActivity className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => onTransfer(device)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Điều chuyển thiết bị"
            >
              <FiRefreshCw className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(device)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Xóa"
            >
              <FiTrash2 className="text-lg" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
