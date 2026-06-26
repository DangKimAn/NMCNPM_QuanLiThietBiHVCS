// Component hiển thị bảng danh sách thiết bị.
// Nhận dữ liệu từ DeviceManager và gọi lại các hàm xử lý khi người dùng bấm nút thao tác.

import { FiActivity, FiEdit2, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import type { Device } from '../../../types/manager';
import { StatusBadge } from '../common/ManagerCommon';
import { Table } from '../../ui/Table';
import type { TableColumn } from '../../ui/Table';

interface DeviceTableProps {
  devices: Device[];
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onStatus: (device: Device) => void;
  onTransfer: (device: Device) => void;
}

export const DeviceTable = ({
  devices,
  onEdit,
  onDelete,
  onStatus,
  onTransfer,
}: DeviceTableProps) => {
  const columns: TableColumn[] = [
    {
      header: 'Mã TB',
      key: 'id',
      render: (d: Device) => <span className="font-bold text-slate-800">{d.id}</span>,
    },
    {
      header: 'Tên thiết bị',
      key: 'name',
      render: (d: Device) => (
        <div>
          <p className="font-semibold text-slate-800">{d.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">Ngày nhập: {d.importDate || 'Chưa cập nhật'}</p>
          {d.note && (
            <p className="text-xs text-slate-500 mt-1 max-w-xs truncate" title={d.note}>
              {d.note}
            </p>
          )}
        </div>
      ),
    },
    { header: 'Loại', key: 'type', render: (d: Device) => <span className="text-slate-600">{d.type}</span> },
    {
      header: 'Phòng',
      key: 'room',
      render: (d: Device) => (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 whitespace-nowrap">
          {d.room}
        </span>
      ),
    },
    { header: 'Trạng thái', key: 'status', render: (d: Device) => <StatusBadge status={d.status} type="device" /> },
  ];

  const renderActions = (device: Device) => (
    <div className="flex items-center gap-3">
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
    </div>
  );

  return (
    <Table
      data={devices}
      columns={columns}
      idKey="equipmentId"
      emptyMessage="Không tìm thấy thiết bị phù hợp."
      onEdit={(device) => onEdit(device)}
      onDelete={(id) => {
        const device = devices.find((d) => d.equipmentId === id);
        if (device) onDelete(device);
      }}
      extraRowActions={renderActions}
      mobilePrimaryColumnKey="name"
      mobileSecondaryColumnKey="id"
    />
  );
};