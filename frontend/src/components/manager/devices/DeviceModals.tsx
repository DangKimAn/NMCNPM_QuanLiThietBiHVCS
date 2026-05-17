// File này chứa các modal dùng trong quản lý thiết bị:
// 1. Modal thêm/sửa thiết bị
// 2. Modal cập nhật trạng thái thiết bị
// 3. Modal điều chuyển thiết bị

import type { FormEvent } from 'react';

import { deviceStatuses, deviceTypes, rooms } from '../../../data/managerMockData';
import type { Device, DeviceStatus } from '../../../types/manager';
import {
  FieldInput,
  FieldSelect,
  FieldTextArea,
  Modal,
} from '../common/ManagerCommon';

interface DeviceFormModalProps {
  editingDevice: Device | null; // Nếu khác null nghĩa là đang sửa thiết bị
  deviceForm: Device; // Dữ liệu trong form thiết bị
  setDeviceForm: (device: Device) => void; // Hàm cập nhật dữ liệu form
  onClose: () => void; // Hàm đóng modal
  onSubmit: (e: FormEvent<HTMLFormElement>) => void; // Hàm lưu thiết bị
}

// Modal thêm mới hoặc chỉnh sửa thông tin thiết bị
export const DeviceFormModal = ({
  editingDevice,
  deviceForm,
  setDeviceForm,
  onClose,
  onSubmit,
}: DeviceFormModalProps) => {
  return (
    <Modal
      title={editingDevice ? `Cập nhật thiết bị - ${editingDevice.id}` : 'Thêm thiết bị mới'}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={editingDevice ? 'Cập nhật' : 'Thêm mới'}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput
          label="Mã thiết bị"
          value={deviceForm.id}
          disabled={!!editingDevice}
          onChange={(value) => setDeviceForm({ ...deviceForm, id: value })}
        />

        <FieldInput
          label="Tên thiết bị"
          value={deviceForm.name}
          onChange={(value) => setDeviceForm({ ...deviceForm, name: value })}
        />

        <FieldSelect
          label="Loại thiết bị"
          value={deviceForm.type}
          options={deviceTypes}
          onChange={(value) => setDeviceForm({ ...deviceForm, type: value })}
        />

        <FieldInput
          label="Số lượng"
          type="number"
          value={deviceForm.quantity}
          onChange={(value) =>
            setDeviceForm({
              ...deviceForm,
              quantity: Math.max(1, Number(value) || 1),
            })
          }
        />

        <FieldSelect
          label="Phòng học"
          value={deviceForm.room}
          options={rooms}
          onChange={(value) => setDeviceForm({ ...deviceForm, room: value })}
        />

        <FieldSelect
          label="Trạng thái"
          value={deviceForm.status}
          options={deviceStatuses}
          onChange={(value) =>
            setDeviceForm({
              ...deviceForm,
              status: value as DeviceStatus,
            })
          }
        />

        <FieldInput
          label="Ngày nhập"
          type="date"
          value={deviceForm.importDate}
          onChange={(value) => setDeviceForm({ ...deviceForm, importDate: value })}
        />

        <div className="md:col-span-2">
          <FieldTextArea
            label="Ghi chú"
            value={deviceForm.note}
            onChange={(value) => setDeviceForm({ ...deviceForm, note: value })}
          />
        </div>
      </div>
    </Modal>
  );
};

interface StatusForm {
  status: DeviceStatus;
  note: string;
}

interface DeviceStatusModalProps {
  device: Device; // Thiết bị đang được cập nhật trạng thái
  statusForm: StatusForm; // Dữ liệu form trạng thái
  setStatusForm: (form: StatusForm) => void; // Hàm cập nhật form trạng thái
  onClose: () => void; // Hàm đóng modal
  onSubmit: (e: FormEvent<HTMLFormElement>) => void; // Hàm lưu trạng thái
}

// Modal cập nhật trạng thái thiết bị: hoạt động, báo hỏng, đang sửa, bảo trì, thanh lý
export const DeviceStatusModal = ({
  device,
  statusForm,
  setStatusForm,
  onClose,
  onSubmit,
}: DeviceStatusModalProps) => {
  return (
    <Modal
      title={`Cập nhật trạng thái - ${device.id}`}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText="Lưu trạng thái"
    >
      {/* Thông tin thiết bị đang được cập nhật */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500">Thiết bị</p>

        <p className="font-bold text-slate-800">{device.name}</p>

        <p className="text-xs text-slate-500 mt-1">
          Phòng hiện tại: {device.room} • Trạng thái hiện tại: {device.status}
        </p>
      </div>

      {/* Form chọn trạng thái mới và nhập ghi chú */}
      <FieldSelect
        label="Trạng thái mới"
        value={statusForm.status}
        options={deviceStatuses}
        onChange={(value) =>
          setStatusForm({
            ...statusForm,
            status: value as DeviceStatus,
          })
        }
      />

      <FieldTextArea
        label="Ghi chú cập nhật"
        value={statusForm.note}
        onChange={(value) => setStatusForm({ ...statusForm, note: value })}
      />
    </Modal>
  );
};

interface TransferForm {
  toRoom: string;
  date: string;
  handler: string;
  reason: string;
}

interface DeviceTransferModalProps {
  device: Device; // Thiết bị đang được điều chuyển
  transferForm: TransferForm; // Dữ liệu form điều chuyển
  setTransferForm: (form: TransferForm) => void; // Hàm cập nhật form điều chuyển
  onClose: () => void; // Hàm đóng modal
  onSubmit: (e: FormEvent<HTMLFormElement>) => void; // Hàm lưu điều chuyển
}

// Modal điều chuyển thiết bị từ phòng hiện tại sang phòng mới
export const DeviceTransferModal = ({
  device,
  transferForm,
  setTransferForm,
  onClose,
  onSubmit,
}: DeviceTransferModalProps) => {
  return (
    <Modal
      title={`Điều chuyển thiết bị - ${device.id}`}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText="Xác nhận điều chuyển"
    >
      {/* Thông tin thiết bị đang được điều chuyển */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500">Thiết bị</p>

        <p className="font-bold text-slate-800">{device.name}</p>

        <p className="text-xs text-slate-500 mt-1">Phòng hiện tại: {device.room}</p>
      </div>

      {/* Form nhập thông tin điều chuyển */}
      <FieldSelect
        label="Phòng mới"
        value={transferForm.toRoom}
        options={rooms}
        onChange={(value) => setTransferForm({ ...transferForm, toRoom: value })}
      />

      <FieldInput
        label="Ngày điều chuyển"
        type="date"
        value={transferForm.date}
        onChange={(value) => setTransferForm({ ...transferForm, date: value })}
      />

      <FieldInput
        label="Người thực hiện"
        value={transferForm.handler}
        onChange={(value) => setTransferForm({ ...transferForm, handler: value })}
      />

      <FieldTextArea
        label="Lý do điều chuyển"
        value={transferForm.reason}
        onChange={(value) => setTransferForm({ ...transferForm, reason: value })}
      />
    </Modal>
  );
};