// Trang chính của phần Cán bộ quản lý thiết bị.
// Có hỗ trợ đọc query trên URL.
// Ví dụ:
// /manager/devices?status=Báo hỏng
// /manager/devices?status=need-handle
// /manager/devices?room=A201

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiBox,
  FiCheckCircle,
  FiCornerUpRight,
  FiLayers,
  FiPlus,
  FiSearch,
  FiTool,
  FiXCircle,
} from 'react-icons/fi';

import { MainLayout } from '../../components/layout/MainLayout';
import {
  FilterSelect,
  getToday,
  SummaryCard,
  TabButton,
} from '../../components/manager/common/ManagerCommon';
import {
  DeviceFormModal,
  DeviceStatusModal,
  DeviceTransferModal,
} from '../../components/manager/devices/DeviceModals';
import { DeviceRoomCards } from '../../components/manager/devices/DeviceRoomCards';
import { DeviceTable } from '../../components/manager/devices/DeviceTable';
import { TransferHistory } from '../../components/manager/devices/TransferHistory';
import {
  deviceStatuses,
  deviceTypes,
  initialDevices,
  initialTransfers,
  rooms,
} from '../../data/managerMockData';
import type { Device, DeviceStatus, TransferLog } from '../../types/manager';

const emptyDevice: Device = {
  id: '',
  name: '',
  type: 'Trình chiếu',
  room: 'A201',
  quantity: 1,
  status: 'Hoạt động',
  importDate: getToday(),
  note: '',
};

interface StatusForm {
  status: DeviceStatus;
  note: string;
}

interface TransferForm {
  toRoom: string;
  date: string;
  handler: string;
  reason: string;
}

export const DeviceManager = () => {
  // Đọc tham số trên URL
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [transfers, setTransfers] = useState<TransferLog[]>(initialTransfers);

  const [activeTab, setActiveTab] = useState<'all' | 'byRoom' | 'transfer'>('all');

  const [keyword, setKeyword] = useState('');
  const [filterRoom, setFilterRoom] = useState(searchParams.get('room') || 'All');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'All');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All');

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceForm, setDeviceForm] = useState<Device>(emptyDevice);

  const [statusDevice, setStatusDevice] = useState<Device | null>(null);
  const [statusForm, setStatusForm] = useState<StatusForm>({
    status: 'Hoạt động',
    note: '',
  });

  const [transferDevice, setTransferDevice] = useState<Device | null>(null);
  const [transferForm, setTransferForm] = useState<TransferForm>({
    toRoom: 'A201',
    date: getToday(),
    handler: 'Cán bộ QLTB',
    reason: '',
  });

  // Khi URL thay đổi, tự động cập nhật bộ lọc
  useEffect(() => {
    const params = new URLSearchParams(searchKey);

    const roomFromUrl = params.get('room') || 'All';
    const typeFromUrl = params.get('type') || 'All';
    const statusFromUrl = params.get('status') || 'All';

    setFilterRoom(roomFromUrl);
    setFilterType(typeFromUrl);
    setFilterStatus(statusFromUrl);

    if (roomFromUrl !== 'All' || typeFromUrl !== 'All' || statusFromUrl !== 'All') {
      setActiveTab('all');
    }
  }, [searchKey]);

  // Lọc thiết bị theo từ khóa, phòng, loại, trạng thái
  const filteredDevices = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    return devices.filter((device) => {
      const matchKeyword =
        !lowerKeyword ||
        device.id.toLowerCase().includes(lowerKeyword) ||
        device.name.toLowerCase().includes(lowerKeyword) ||
        device.type.toLowerCase().includes(lowerKeyword) ||
        device.room.toLowerCase().includes(lowerKeyword);

      const matchRoom = filterRoom === 'All' || device.room === filterRoom;
      const matchType = filterType === 'All' || device.type === filterType;

      const matchStatus =
        filterStatus === 'All' ||
        (filterStatus === 'need-handle'
          ? ['Báo hỏng', 'Đang sửa', 'Bảo trì'].includes(device.status)
          : device.status === filterStatus);

      return matchKeyword && matchRoom && matchType && matchStatus;
    });
  }, [devices, keyword, filterRoom, filterType, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: devices.length,
      good: devices.filter((device) => device.status === 'Hoạt động').length,
      needFix: devices.filter((device) =>
        ['Báo hỏng', 'Đang sửa', 'Bảo trì'].includes(device.status),
      ).length,
      discarded: devices.filter((device) => device.status === 'Thanh lý').length,
    };
  }, [devices]);

  const openAddModal = () => {
    setEditingDevice(null);

    setDeviceForm({
      ...emptyDevice,
      id: `TB${String(devices.length + 1).padStart(3, '0')}`,
      importDate: getToday(),
    });

    setIsDeviceModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setDeviceForm(device);
    setIsDeviceModalOpen(true);
  };

  const saveDevice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!deviceForm.id.trim() || !deviceForm.name.trim()) {
      alert('Vui lòng nhập mã thiết bị và tên thiết bị.');
      return;
    }

    if (editingDevice) {
      setDevices((current) =>
        current.map((device) => (device.id === editingDevice.id ? deviceForm : device)),
      );
    } else {
      const isDuplicate = devices.some((device) => device.id === deviceForm.id);

      if (isDuplicate) {
        alert('Mã thiết bị đã tồn tại.');
        return;
      }

      setDevices((current) => [...current, deviceForm]);
    }

    setIsDeviceModalOpen(false);
  };

  const deleteDevice = (id: string) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa thiết bị ${id}?`);

    if (!confirmDelete) return;

    setDevices((current) => current.filter((device) => device.id !== id));
  };

  const openStatusModal = (device: Device) => {
    setStatusDevice(device);

    setStatusForm({
      status: device.status,
      note: device.note,
    });
  };

  const saveStatus = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!statusDevice) return;

    setDevices((current) =>
      current.map((device) =>
        device.id === statusDevice.id
          ? {
              ...device,
              status: statusForm.status,
              note: statusForm.note,
            }
          : device,
      ),
    );

    setStatusDevice(null);
  };

  const openTransferModal = (device: Device) => {
    setTransferDevice(device);

    const suggestedRoom = rooms.find((room) => room !== device.room) || 'Kho';

    setTransferForm({
      toRoom: suggestedRoom,
      date: getToday(),
      handler: 'Cán bộ QLTB',
      reason: '',
    });
  };

  const saveTransfer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!transferDevice) return;

    if (transferForm.toRoom === transferDevice.room) {
      alert('Phòng mới phải khác phòng hiện tại.');
      return;
    }

    const newLog: TransferLog = {
      id: `DC${String(transfers.length + 1).padStart(3, '0')}`,
      deviceId: transferDevice.id,
      deviceName: transferDevice.name,
      fromRoom: transferDevice.room,
      toRoom: transferForm.toRoom,
      date: transferForm.date,
      handler: transferForm.handler,
      reason: transferForm.reason || 'Điều chuyển theo nhu cầu sử dụng phòng học.',
    };

    setDevices((current) =>
      current.map((device) =>
        device.id === transferDevice.id
          ? {
              ...device,
              room: transferForm.toRoom,
              note: `Điều chuyển từ ${transferDevice.room} sang ${transferForm.toRoom} ngày ${transferForm.date}. ${device.note}`,
            }
          : device,
      ),
    );

    setTransfers((current) => [newLog, ...current]);
    setTransferDevice(null);
    setActiveTab('transfer');
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Cán bộ quản lý thiết bị</h1>

          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh mục thiết bị, phân bổ phòng học, điều chuyển và cập nhật trạng thái.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <FiPlus className="mr-2 text-lg" />
          Thêm thiết bị mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<FiBox />} label="Tổng thiết bị" value={stats.total} />
        <SummaryCard icon={<FiCheckCircle />} label="Hoạt động" value={stats.good} />
        <SummaryCard icon={<FiTool />} label="Cần xử lý" value={stats.needFix} />
        <SummaryCard icon={<FiXCircle />} label="Thanh lý" value={stats.discarded} />
      </div>

      <div className="border-b border-slate-200 mb-6">
        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            icon={<FiBox />}
            label="Danh mục thiết bị"
          />

          <TabButton
            active={activeTab === 'byRoom'}
            onClick={() => setActiveTab('byRoom')}
            icon={<FiLayers />}
            label="Thiết bị theo phòng"
          />

          <TabButton
            active={activeTab === 'transfer'}
            onClick={() => setActiveTab('transfer')}
            icon={<FiCornerUpRight />}
            label="Điều chuyển thiết bị"
          />
        </nav>
      </div>

      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm mã, tên, loại, phòng..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <FilterSelect
              value={filterRoom}
              onChange={setFilterRoom}
              options={rooms}
              label="Tất cả phòng"
            />

            <FilterSelect
              value={filterType}
              onChange={setFilterType}
              options={deviceTypes}
              label="Tất cả loại"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="need-handle">Cần xử lý</option>

              {deviceStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <DeviceTable
            devices={filteredDevices}
            onEdit={openEditModal}
            onDelete={deleteDevice}
            onStatus={openStatusModal}
            onTransfer={openTransferModal}
          />
        </div>
      )}

      {activeTab === 'byRoom' && (
        <DeviceRoomCards
          rooms={rooms}
          devices={devices}
          onStatus={openStatusModal}
          onTransfer={openTransferModal}
        />
      )}

      {activeTab === 'transfer' && <TransferHistory transfers={transfers} />}

      {isDeviceModalOpen && (
        <DeviceFormModal
          editingDevice={editingDevice}
          deviceForm={deviceForm}
          setDeviceForm={setDeviceForm}
          onClose={() => setIsDeviceModalOpen(false)}
          onSubmit={saveDevice}
        />
      )}

      {statusDevice && (
        <DeviceStatusModal
          device={statusDevice}
          statusForm={statusForm}
          setStatusForm={setStatusForm}
          onClose={() => setStatusDevice(null)}
          onSubmit={saveStatus}
        />
      )}

      {transferDevice && (
        <DeviceTransferModal
          device={transferDevice}
          transferForm={transferForm}
          setTransferForm={setTransferForm}
          onClose={() => setTransferDevice(null)}
          onSubmit={saveTransfer}
        />
      )}
    </MainLayout>
  );
};