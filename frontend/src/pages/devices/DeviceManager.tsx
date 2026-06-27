import { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react';
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
  FiChevronRight,
  FiArrowLeft,
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
import { EquipmentTransferImportModal } from '../../components/manager/devices/EquipmentTransferImportModal';
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

const buildPageWindow = (current: number, total: number): (number | '...')[] => {
  const pages: (number | '...')[] = [];
  const delta = 2;
  const left  = current - delta;
  const right = current + delta;
  if (left > 2) { pages.push(1, '...'); } else { for (let i = 1; i < left; i++) pages.push(i); }
  for (let i = Math.max(1, left); i <= Math.min(total, right); i++) pages.push(i);
  if (right < total - 1) { pages.push('...', total); } else { for (let i = right + 1; i <= total; i++) pages.push(i); }
  return pages;
};

const Pagination = memo(({ current, total, onChange, prefix = '' }: { current: number; total: number; onChange: (p: number) => void; prefix?: string }) => {
  if (total <= 1) return null;
  const window = buildPageWindow(current, total);
  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">← Trước</button>
      {window.map((p, i) => p === '...' ? (
        <span key={`${prefix}d${i}`} className="px-1 text-slate-400 select-none">...</span>
      ) : (
        <button key={`${prefix}${p}`} type="button" onClick={() => onChange(p as number)}
          className={`h-8 w-8 rounded-lg border text-sm font-medium ${p === current ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
      ))}
      <button type="button" onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sau →</button>
    </div>
  );
});

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
  const keywordTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
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
  const roomSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Drill-down: null = hiển danh sách nhóm, string = hiển thiết bị của nhóm đó
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGeneralTransferOpen, setIsGeneralTransferOpen] = useState(false);
  const [isTransferImportOpen, setIsTransferImportOpen] = useState(false);

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
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // ──── Pagination ────────────────────────────────────────────
  const PAGE_DEVICES  = 15;
  const PAGE_ROOMS    = 9;
  const PAGE_TRANSFER = 15;

  const [devicePage,   setDevicePage]   = useState(1);
  const [roomPage,     setRoomPage]     = useState(1);
  const [transferPage, setTransferPage] = useState(1);

  // ────────────────────────────────────────────────────────────

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

    const tabParam = params.get('tab');
    if (tabParam === 'byRoom' || tabParam === 'transfer' || tabParam === 'all') {
      setActiveTab(tabParam);
    } else if (searchKey && !tabParam) {
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

  // Reset device page khi filter thay đổi
  useEffect(() => { setDevicePage(1); }, [keyword, filterRoom, filterType, filterStatus, selectedCategory]);

  // Paged data
  const deviceTotalPages   = Math.max(1, Math.ceil(filteredDevices.length / PAGE_DEVICES));
  const deviceSafePage     = Math.min(devicePage, deviceTotalPages);
  const pagedDevices       = filteredDevices.slice((deviceSafePage - 1) * PAGE_DEVICES, deviceSafePage * PAGE_DEVICES);

  // Thống kê theo nhóm loại
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catDevices = devices.filter((d) => d.type === cat.name);
      return {
        name: cat.name,
        total: catDevices.length,
        active: catDevices.filter((d) => d.status === 'Hoạt động').length,
        needFix: catDevices.filter((d) => ['Báo hỏng', 'Đang sửa', 'Bảo trì'].includes(d.status)).length,
        discarded: catDevices.filter((d) => d.status === 'Thanh lý').length,
      };
    });
  }, [categories, devices]);


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
      setIsSubmittingTransfer(true);
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
    } finally {
      setIsSubmittingTransfer(false);
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
            onClick={openAddModal}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <FiPlus className="mr-2 text-lg" />
            Thêm thiết bị mới
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
          {/* ── MÀN HÌNH 1: DANH SÁCH NHÓM ── */}
          {selectedCategory === null && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryStats.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setFilterType(cat.name);
                      setKeyword('');
                      setFilterRoom('All');
                      setFilterStatus('All');
                    }}
                    className="text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all p-5 group"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <FiBox className="text-indigo-600 text-lg" />
                      </div>
                      <FiChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors text-lg" />
                    </div>

                    {/* Category name */}
                    <p className="font-bold text-slate-800 text-base mb-1 truncate">{cat.name}</p>
                    <p className="text-2xl font-black text-indigo-600 mb-3">{cat.total}</p>

                    {/* Sub-stats */}
                    <div className="grid grid-cols-3 gap-1 text-xs text-center">
                      <div className="bg-emerald-50 rounded-lg py-1.5">
                        <p className="font-bold text-emerald-700">{cat.active}</p>
                        <p className="text-emerald-500">Hoạt động</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg py-1.5">
                        <p className="font-bold text-amber-700">{cat.needFix}</p>
                        <p className="text-amber-500">Cần xử lý</p>
                      </div>
                      <div className="bg-slate-100 rounded-lg py-1.5">
                        <p className="font-bold text-slate-600">{cat.discarded}</p>
                        <p className="text-slate-400">Thanh lý</p>
                      </div>
                    </div>
                  </button>
                ))}

                {categoryStats.length === 0 && (
                  <div className="col-span-4 py-12 text-center text-slate-500">
                    Chưa có danh mục thiết bị nào.
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── MÀN HÌNH 2: THIẾT BỊ TRONG NHÓM ── */}
          {selectedCategory !== null && (
            <div className="space-y-4">
              {/* Breadcrumb + nút quay lại */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setFilterType('All');
                    setKeyword('');
                    setFilterRoom('All');
                    setFilterStatus('All');
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <FiArrowLeft />
                  Danh mục thiết bị
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-semibold text-indigo-600">{selectedCategory}</span>
              </div>

              {/* Filter bar */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(e) => {
                      if (keywordTimeoutRef.current) clearTimeout(keywordTimeoutRef.current);
                      keywordTimeoutRef.current = setTimeout(() => setKeyword(e.target.value), 300);
                    }}
                    placeholder="Tìm mã, tên, phòng..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <FilterSelect
                  value={filterRoom}
                  onChange={setFilterRoom}
                  options={roomOptions}
                  label="Tất cả phòng"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="need-handle">Cần xử lý</option>
                  {deviceStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Pagination trên */}
              <Pagination current={deviceSafePage} total={deviceTotalPages} onChange={setDevicePage} prefix="dev-top-" />

              {/* Bảng thiết bị */}
              <DeviceTable
                devices={pagedDevices}
                onEdit={openEditModal}
                onDelete={deleteDevice}
                onStatus={openStatusModal}
                onTransfer={openTransferModal}
              />

              {/* Pagination dưới */}
              <Pagination current={deviceSafePage} total={deviceTotalPages} onChange={setDevicePage} prefix="dev-bot-" />
            </div>
          )}
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
                onChange={(e) => {
                  if (roomSearchTimeoutRef.current) clearTimeout(roomSearchTimeoutRef.current);
                  roomSearchTimeoutRef.current = setTimeout(() => setRoomSearchTerm(e.target.value), 300);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Thiết bị theo phòng - Pagination */}
          {(() => {
            const allRooms = roomOptions
              .filter((room) => room !== 'Kho')
              .filter((room) => room.toLowerCase().includes(roomSearchTerm.toLowerCase()))
              .filter((room) => devices.some((device) => device.room === room))
              .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
            const roomTotalPages = Math.max(1, Math.ceil(allRooms.length / PAGE_ROOMS));
            const roomSafePage   = Math.min(roomPage, roomTotalPages);
            const pagedRooms     = allRooms.slice((roomSafePage - 1) * PAGE_ROOMS, roomSafePage * PAGE_ROOMS);
            return (
              <>
                <DeviceRoomCards
                  rooms={pagedRooms}
                  devices={devices}
                  onStatus={openStatusModal}
                  onTransfer={openTransferModal}
                />
                <div className="mt-4">
                  <Pagination current={roomSafePage} total={roomTotalPages} onChange={setRoomPage} prefix="room-" />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!loading && activeTab === 'transfer' && (() => {
        const transferTotalPages = Math.max(1, Math.ceil(transfers.length / PAGE_TRANSFER));
        const transferSafePage   = Math.min(transferPage, transferTotalPages);
        const pagedTransfers     = transfers.slice((transferSafePage - 1) * PAGE_TRANSFER, transferSafePage * PAGE_TRANSFER);
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Pagination current={transferSafePage} total={transferTotalPages} onChange={setTransferPage} prefix="tr-" />
            </div>
            <TransferHistory
              transfers={pagedTransfers}
              onOpenTransfer={() => {
                setTransferForm({ fromRoom: '', equipmentId: '', toRoom: '', quantity: 1, date: getToday(), handler: 'Cán bộ QLTB', reason: '' });
                setIsGeneralTransferOpen(true);
              }}
            />
            <div className="flex justify-end">
              <Pagination current={transferSafePage} total={transferTotalPages} onChange={setTransferPage} prefix="tr2-" />
            </div>
          </div>
        );
      })()}

      {isDeviceModalOpen && (
        <DeviceFormModal
          editingDevice={editingDevice}
          deviceForm={deviceForm}
          setDeviceForm={setDeviceForm}
          roomOptions={roomOptions}
          typeOptions={typeOptions}
          onClose={() => setIsDeviceModalOpen(false)}
          onSubmit={saveDevice}
          onImportExcel={() => setIsImportModalOpen(true)}
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
          onTransferImport={() => setIsTransferImportOpen(true)}
          isSubmitting={isSubmittingTransfer}
        />
      )}

      <DeviceImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchAllData()}
      />

      <EquipmentTransferImportModal
        isOpen={isTransferImportOpen}
        onClose={() => setIsTransferImportOpen(false)}
        onSuccess={() => {
          setIsTransferImportOpen(false);
          fetchAllData();
        }}
      />
    </ManagerLayout>
  );
};