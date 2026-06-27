import type { FormEvent } from 'react';
import { useMemo } from 'react';
import { FiUpload } from 'react-icons/fi';

import { deviceStatuses } from '../../../data/managerMockData';
import type { Device, DeviceStatus } from '../../../types/manager';
import {
  FieldInput,
  FieldSelect,
  FieldSearchSelect,
  FieldTextArea,
  Modal,
} from '../common/ManagerCommon';
import { useFormConfig } from '../../../hooks/useFormConfig';

interface DeviceFormModalProps {
  editingDevice: Device | null;
  deviceForm: Device;
  setDeviceForm: (device: Device) => void;
  roomOptions: string[];
  typeOptions: string[];
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onImportExcel?: () => void;
}

export const DeviceFormModal = ({
  editingDevice,
  deviceForm,
  setDeviceForm,
  roomOptions,
  typeOptions,
  onClose,
  onSubmit,
  onImportExcel,
}: DeviceFormModalProps) => {
  const { fields: configFields } = useFormConfig('equipment');

  const configMap = useMemo(() => {
    const map = new Map<string, boolean>();
    configFields.forEach((f) => map.set(f.fieldKey, true));
    return map;
  }, [configFields]);

  const hasConfig = configFields.length > 0;

  return (
    <Modal
      title={
        editingDevice
          ? `Cập nhật thiết bị - ${editingDevice.id}`
          : 'Thêm thiết bị mới'
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={editingDevice ? 'Cập nhật' : 'Thêm mới'}
      extraActions={
        !editingDevice && onImportExcel ? (
          <button
            type="button"
            onClick={onImportExcel}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition shadow-sm"
          >
            <FiUpload className="mr-2 text-lg" />
            Import Excel
          </button>
        ) : null
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(hasConfig ? configMap.get('equipmentCode') !== false : true) && (
          <FieldInput
            label="Mã thiết bị"
            value={deviceForm.id}
            required
            onChange={(value) => setDeviceForm({ ...deviceForm, id: value })}
          />
        )}

        {(hasConfig ? configMap.get('name') !== false : true) && (
          <FieldInput
            label="Tên thiết bị"
            value={deviceForm.name}
            onChange={(value) => setDeviceForm({ ...deviceForm, name: value })}
          />
        )}

        {(hasConfig ? configMap.get('categoryId') !== false : true) && (
          <FieldSelect
            label="Loại thiết bị"
            value={deviceForm.type}
            options={typeOptions}
            onChange={(value) => setDeviceForm({ ...deviceForm, type: value })}
          />
        )}

        {(hasConfig ? configMap.get('room') !== false : true) && (
          <FieldSelect
            label="Phòng học"
            value={deviceForm.room}
            options={roomOptions}
            onChange={(value) => setDeviceForm({ ...deviceForm, room: value })}
          />
        )}

        {(hasConfig ? configMap.get('status') !== false : true) && (
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
        )}

        {(hasConfig ? configMap.get('importDate') !== false : true) && (
          <FieldInput
            label="Ngày nhập"
            type="date"
            value={deviceForm.importDate}
            required={false}
            onChange={(value) =>
              setDeviceForm({ ...deviceForm, importDate: value })
            }
          />
        )}

        {(hasConfig ? configMap.get('note') !== false : true) && (
          <div className="md:col-span-2">
            <FieldTextArea
              label="Ghi chú"
              value={deviceForm.note}
              onChange={(value) => setDeviceForm({ ...deviceForm, note: value })}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

interface StatusForm {
  status: DeviceStatus;
  note: string;
}

interface DeviceStatusModalProps {
  device: Device;
  statusForm: StatusForm;
  setStatusForm: (form: StatusForm) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

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
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500">Thiết bị</p>

        <p className="font-bold text-slate-800">{device.name}</p>

        <p className="text-xs text-slate-500 mt-1">
          Mã thiết bị: {device.id} • Phòng hiện tại: {device.room} • Trạng thái
          hiện tại: {device.status}
        </p>
      </div>

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
  fromRoom?: string;
  equipmentId?: string;
  toRoom: string;
  quantity: number;
  date: string;
  handler: string;
  reason: string;
}

interface DeviceTransferModalProps {
  device: Device | null;
  devices?: Device[];
  transferForm: TransferForm;
  setTransferForm: (form: TransferForm) => void;
  roomOptions: string[];
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onTransferImport?: () => void;
  isSubmitting?: boolean;
}

export const DeviceTransferModal = ({
  device,
  devices,
  transferForm,
  setTransferForm,
  roomOptions,
  onClose,
  onSubmit,
  onTransferImport,
  isSubmitting,
}: DeviceTransferModalProps) => {
  return (
    <Modal
      title={
        device
          ? `Điều chuyển thiết bị - ${device.id}`
          : 'Điều chuyển thiết bị'
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitText="Xác nhận điều chuyển"
      isSubmitting={isSubmitting}
      extraActions={
        !device && onTransferImport ? (
          <button
            type="button"
            onClick={onTransferImport}
            className="flex items-center justify-center px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition shadow-sm"
          >
            <FiUpload className="mr-2 text-lg" />
            Chuyển thiết bị
          </button>
        ) : null
      }
    >
      {device ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Thiết bị</p>

          <p className="font-bold text-slate-800">{device.name}</p>

          <p className="text-xs text-slate-500 mt-1">
            Mã thiết bị: {device.id}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Phòng hiện tại: {device.room}
          </p>
        </div>
      ) : (
        <>
          <FieldSearchSelect
            label="Phòng hiện tại (Từ phòng)"
            value={transferForm.fromRoom || ''}
            options={roomOptions}
            onChange={(value) =>
              setTransferForm({
                ...transferForm,
                fromRoom: value,
                equipmentId: '',
                quantity: 1,
              })
            }
          />

          <div className="mt-4 mb-4">
            <FieldSearchSelect
              label="Thiết bị cần chuyển"
              value={transferForm.equipmentId || ''}
              options={
                devices
                  ?.filter((item) => item.room === transferForm.fromRoom)
                  .map((item) => ({
                    value: String(item.equipmentId),
                    label: `${item.id} - ${item.name}`,
                  })) || []
              }
              onChange={(value) =>
                setTransferForm({
                  ...transferForm,
                  equipmentId: value,
                  quantity: 1,
                })
              }
            />
          </div>
        </>
      )}

      <FieldSearchSelect
        label="Phòng mới (Đến phòng)"
        value={transferForm.toRoom}
        options={roomOptions}
        onChange={(value) =>
          setTransferForm({ ...transferForm, toRoom: value })
        }
      />

      <FieldInput
        label="Ngày điều chuyển"
        type="date"
        value={transferForm.date}
        onChange={(value) =>
          setTransferForm({ ...transferForm, date: value })
        }
      />

      <FieldInput
        label="Người thực hiện"
        value={transferForm.handler}
        onChange={(value) =>
          setTransferForm({ ...transferForm, handler: value })
        }
      />

      <FieldTextArea
        label="Lý do điều chuyển"
        value={transferForm.reason}
        onChange={(value) =>
          setTransferForm({ ...transferForm, reason: value })
        }
      />
    </Modal>
  );
};