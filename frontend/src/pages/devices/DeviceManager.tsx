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
  FiUpload,
} from 'react-icons/fi';

import { ManagerLayout } from '../../components/layout/ManagerLayout';
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
import { DeviceImportExcelModal } from '../../components/manager/devices/DeviceImportExcelModal';
import { DeviceRoomCards } from '../../components/manager/devices/DeviceRoomCards';
import { DeviceTable } from '../../components/manager/devices/DeviceTable';
import { TransferHistory } from '../../components/manager/devices/TransferHistory';
import { deviceStatuses } from '../../data/managerMockData';
import {
  managerApi,
  type BackendCategory,
  type BackendRoom,
} from '../../services/managerApi';
import type { Device, DeviceStatus, TransferLog } from '../../types/manager';

const emptyDevice: Device = {
  equipmentId: 0,
  id: '',
  name: '',
  type: '',
  room: '',
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
  fromRoom?: string;
  equipmentId?: string;
  toRoom: string;
  quantity: number;
  date: string;
  handler: string;
  reason: string;
}

export const DeviceManager = () => {
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const [devices, setDevices] = useState<Device[]>([]);
  const [transfers, setTransfers] = useState<TransferLog[]>([]);
  const [rooms, setRooms] = useState<BackendRoom[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'all' | 'byRoom' | 'transfer'>(
    'all',
  );

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [filterRoom, setFilterRoom] = useState(
    searchParams.get('room') || 'All',
  );
  const [filterType, setFilterType] = useState(
    searchParams.get('type') || 'All',
  );
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get('status') || 'All',
  );

  const [roomSearchTerm, setRoomSearchTerm] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGeneralTransferOpen, setIsGeneralTransferOpen] = useState(false);

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
    fromRoom: '',
    equipmentId: '',
    toRoom: '',
    quantity: 1,
    date: getToday(),
    handler: 'Cán bộ QLTB',
    reason: '',
  });

  const roomOptions = useMemo(() => {
    const codes = rooms.map((room) => room.code);
    return codes.length > 0 ? [...codes, 'Kho'] : ['Kho'];
  }, [rooms]);

  const typeOptions = useMemo(() => {
    const names = categories.map((category) => category.name);
    return names.length > 0 ? names : ['Khác'];
  }, [categories]);

  const getRoomIdByCode = (code: string) => {
    return rooms.find((room) => room.code === code)?.roomId;
  };

  const getCategoryIdByName = (name: string) => {
    return categories.find((category) => category.name === name)?.categoryId;
  };

  const getExecutorId = () => {
    const rawUser = localStorage.getItem('currentUser');

    if (!rawUser) return 1;

    try {
      const user = JSON.parse(rawUser);
      return Number(user.userId || user.id || 1);
    } catch {
      return 1;
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const [roomData, categoryData, deviceData, transferData] =
        await Promise.all([
          managerApi.getRooms(),
          managerApi.getCategories(),
          managerApi.getDevices(),
          managerApi.getTransfers(),
        ]);

      setRooms(roomData);
      setCategories(categoryData);
      setDevices(deviceData);
      setTransfers(transferData);

      if (!deviceForm.type && categoryData[0]) {
        setDeviceForm((current) => ({
          ...current,
          type: categoryData[0].name,
        }));
      }

      if (!deviceForm.room && roomData[0]) {
        setDeviceForm((current) => ({
          ...current,
          room: roomData[0].code,
        }));
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể tải dữ liệu thiết bị từ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);

    setKeyword(params.get('keyword') || '');
    setFilterRoom(params.get('room') || 'All');
    setFilterType(params.get('type') || 'All');
    setFilterStatus(params.get('status') || 'All');

    if (searchKey) {
      setActiveTab('all');
    }
  }, [searchKey]);

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
      discarded: devices.filter((device) => device.status === 'Thanh lý')
        .length,
    };
  }, [devices]);

  const openAddModal = () => {
    setEditingDevice(null);

    setDeviceForm({
      ...emptyDevice,
      id: '',
      type: typeOptions[0] || 'Khác',
      room: roomOptions[0] || 'Kho',
      importDate: getToday(),
    });

    setIsDeviceModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setDeviceForm(device);
    setIsDeviceModalOpen(true);
  };

  const saveDevice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!deviceForm.id.trim()) {
      alert('Vui lòng nhập mã thiết bị.');
      return;
    }

    if (!deviceForm.name.trim()) {
      alert('Vui lòng nhập tên thiết bị.');
      return;
    }

    const categoryId = getCategoryIdByName(deviceForm.type);

    if (!categoryId) {
      alert(
        'Loại thiết bị không hợp lệ. Vui lòng tạo loại thiết bị trong backend trước.',
      );
      return;
    }

    try {
      if (editingDevice) {
        await managerApi.updateEquipment(editingDevice.equipmentId, {
          equipmentCode: deviceForm.id,
          name: deviceForm.name,
          categoryId,
          status: deviceForm.status,
          description: deviceForm.note,
        });
      } else {
        const created = await managerApi.createEquipment({
          equipmentCode: deviceForm.id,
          name: deviceForm.name,
          categoryId,
          status: deviceForm.status,
          description: deviceForm.note,
        });

        const roomId = getRoomIdByCode(deviceForm.room);

        if (roomId) {
          await managerApi.allocateEquipment({
            equipmentId: created.equipmentId,
            roomId,
            quantity: 1,
            allocatedAt: deviceForm.importDate || getToday(),
            note: `Gắn thiết bị ${deviceForm.name} vào phòng ${deviceForm.room}`,
          });
        }
      }

      setIsDeviceModalOpen(false);
      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Không thể lưu thiết bị. Kiểm tra backend hoặc dữ liệu nhập.');
    }
  };

  const deleteDevice = async (device: Device) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa thiết bị ${device.id}?`,
    );

    if (!confirmDelete) return;

    try {
      await managerApi.deleteEquipment(device.equipmentId);
      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Không thể xóa thiết bị.');
    }
  };

  const openStatusModal = (device: Device) => {
    setStatusDevice(device);

    setStatusForm({
      status: device.status,
      note: device.note,
    });
  };

  const saveStatus = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!statusDevice) return;

    try {
      await managerApi.updateEquipmentStatus(statusDevice.equipmentId, {
        status: statusForm.status,
        description: statusForm.note,
      });

      setStatusDevice(null);
      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Không thể cập nhật trạng thái thiết bị.');
    }
  };

  const openTransferModal = (device: Device) => {
    setTransferDevice(device);

    const suggestedRoom =
      roomOptions.find((room) => room !== device.room) || roomOptions[0] || '';

    setTransferForm({
      fromRoom: device.room,
      equipmentId: String(device.equipmentId),
      toRoom: suggestedRoom,
      quantity: 1,
      date: getToday(),
      handler: 'Cán bộ QLTB',
      reason: '',
    });
  };

  const saveTransfer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fromRoomCode = transferDevice
      ? transferDevice.room
      : transferForm.fromRoom;

    const eqId = transferDevice
      ? transferDevice.equipmentId
      : Number(transferForm.equipmentId);

    if (!fromRoomCode || !eqId) {
      alert('Vui lòng chọn thiết bị và phòng hiện tại.');
      return;
    }

    const fromRoomId = getRoomIdByCode(fromRoomCode);
    const toRoomId = getRoomIdByCode(transferForm.toRoom);

    if (!fromRoomId || !toRoomId) {
      alert('Không xác định được phòng hiện tại hoặc phòng mới.');
      return;
    }

    if (fromRoomId === toRoomId) {
      alert('Phòng mới phải khác phòng hiện tại.');
      return;
    }

    try {
      await managerApi.createTransfer({
        equipmentId: eqId,
        fromRoomId,
        toRoomId,
        quantity: 1,
        transferredAt: transferForm.date,
        executorId: getExecutorId(),
        note:
          transferForm.reason ||
          'Điều chuyển theo nhu cầu sử dụng phòng học.',
      });

      setTransferDevice(null);
      setIsGeneralTransferOpen(false);
      setActiveTab('transfer');
      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert(
        'Không thể điều chuyển thiết bị. Kiểm tra dữ liệu phòng, thiết bị hoặc người thực hiện.',
      );
    }
  };

  return (
    <ManagerLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Cán bộ quản lý thiết bị
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh mục thiết bị, phân bổ phòng học, điều chuyển và cập
            nhật trạng thái.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition shadow-sm"
          >
            <FiUpload className="mr-2 text-lg" />
            Import Excel
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <FiPlus className="mr-2 text-lg" />
            Thêm thiết bị mới
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<FiBox />} label="Tổng thiết bị" value={stats.total} />
        <SummaryCard
          icon={<FiCheckCircle />}
          label="Hoạt động"
          value={stats.good}
        />
        <SummaryCard icon={<FiTool />} label="Cần xử lý" value={stats.needFix} />
        <SummaryCard
          icon={<FiXCircle />}
          label="Thanh lý"
          value={stats.discarded}
        />
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

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Đang tải dữ liệu thiết bị...
        </div>
      )}

      {!loading && activeTab === 'all' && (
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
              options={roomOptions}
              label="Tất cả phòng"
            />

            <FilterSelect
              value={filterType}
              onChange={setFilterType}
              options={typeOptions}
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

      {!loading && activeTab === 'byRoom' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Tìm kiếm tên phòng học..."
                value={roomSearchTerm}
                onChange={(e) => setRoomSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <DeviceRoomCards
            rooms={roomOptions
              .filter((room) => room !== 'Kho')
              .filter((room) =>
                room.toLowerCase().includes(roomSearchTerm.toLowerCase()),
              )}
            devices={devices}
            onStatus={openStatusModal}
            onTransfer={openTransferModal}
          />
        </div>
      )}

      {!loading && activeTab === 'transfer' && (
        <TransferHistory
          transfers={transfers}
          onOpenTransfer={() => {
            setTransferForm({
              fromRoom: '',
              equipmentId: '',
              toRoom: '',
              quantity: 1,
              date: getToday(),
              handler: 'Cán bộ QLTB',
              reason: '',
            });
            setIsGeneralTransferOpen(true);
          }}
        />
      )}

      {isDeviceModalOpen && (
        <DeviceFormModal
          editingDevice={editingDevice}
          deviceForm={deviceForm}
          setDeviceForm={setDeviceForm}
          roomOptions={roomOptions}
          typeOptions={typeOptions}
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

      {(transferDevice || isGeneralTransferOpen) && (
        <DeviceTransferModal
          device={transferDevice}
          devices={devices}
          transferForm={transferForm}
          setTransferForm={setTransferForm}
          roomOptions={roomOptions.filter((room) => room !== 'Kho')}
          onClose={() => {
            setTransferDevice(null);
            setIsGeneralTransferOpen(false);
          }}
          onSubmit={saveTransfer}
        />
      )}

      <DeviceImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchAllData()}
      />
    </ManagerLayout>
  );
};