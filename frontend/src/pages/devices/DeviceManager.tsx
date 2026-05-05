import { useState, useRef } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FiPlus, FiFilter, FiBox, FiLayers, FiUpload } from 'react-icons/fi';

import { Table } from '../../components/ui/Table';
import { Grid } from '../../components/manager/Grid';
import { DynamicFormModal } from '../../components/ui/DynamicFormModal';
import { PageHeader } from '../../components/ui/PageHeader';

import type { TableColumn } from '../../components/ui/Table';
import { useCrud } from '../../hooks/useCrud';

import { FilterSelect } from '../../components/manager/FilterSelect';
import type { FormField } from '../../components/ui/DynamicFormModal';
// ĐỊNH NGHĨA CÁC CỘT CỦA THIẾT BỊ CHO FORM ĐỘNG
const deviceFields: FormField[] = [
  { name: 'id', label: 'Mã thiết bị', type: 'text', required: true, readOnlyOnEdit: true },
  { name: 'status', label: 'Trạng thái', type: 'select', options: ['Hoạt động', 'Đang sửa', 'Báo hỏng', 'Bảo trì', 'Thanh lý'], defaultValue: 'Hoạt động' },
  { name: 'name', label: 'Tên thiết bị', type: 'text', required: true, fullWidth: true },
  { name: 'type', label: 'Loại thiết bị', type: 'select', options: ['Trình chiếu', 'Âm thanh', 'Điện lạnh', 'Phụ kiện', 'Khác'], defaultValue: 'Trình chiếu' },
  { name: 'room', label: 'Phòng học', type: 'select', options: ['A201', 'A202', 'B105', 'Kho'], defaultValue: 'A201' }
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Hoạt động': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Báo hỏng': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'Đang sửa': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Bảo trì': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Thanh lý': return 'bg-slate-200 text-slate-600 border-slate-300';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const initialDevices = [
  { id: 'TB001', name: 'Máy chiếu Panasonic PT-LB303', room: 'A201', type: 'Trình chiếu', status: 'Hoạt động' },
  { id: 'TB002', name: 'Micro không dây Shure', room: 'A201', type: 'Âm thanh', status: 'Hoạt động' },
  { id: 'TB003', name: 'Dây cáp chuyển đổi HDMI', room: 'A202', type: 'Phụ kiện', status: 'Báo hỏng' },
  { id: 'TB004', name: 'Điều hòa Daikin 18000BTU', room: 'B105', type: 'Điện lạnh', status: 'Đang sửa' },
];
// 2. Khai báo deviceColumns chuẩn UI
const deviceColumns: TableColumn[] = [
  { 
    header: 'Mã TB', 
    key: 'id', 
    render: (item) => <span className="font-medium text-slate-900">{item.id}</span> 
  },
  { 
    header: 'Tên thiết bị', 
    key: 'name', 
    render: (item) => <span className="font-medium text-slate-700">{item.name}</span> 
  },
  { 
    header: 'Loại', 
    key: 'type',
    render: (item) => <span className="text-slate-500">{item.type}</span>
  },
  { 
    header: 'Phòng học', 
    key: 'room', 
    render: (item) => (
      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">
        {item.room}
      </span>
    ) 
  },
  { 
    header: 'Trạng thái', 
    key: 'status', 
    render: (item) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(item.status)}`}>
        {item.status}
      </span>
    ) 
  }
];

export const DeviceManager = () => {

  const {
    data: devices,
    isModalOpen,
    editingItem: editingDevice,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSave: handleSaveDevice,
    handleDelete,
    setIsModalOpen
  } = useCrud(initialDevices, 'id');

  // --- STATE GIAO DIỆN ĐẶC THÙ ---
  const [activeTab, setActiveTab] = useState('all');
  const [filterRoom, setFilterRoom] = useState('All');

  // --- LOGIC XÓA (Tận dụng hook) ---
  const onDeleteDevice = (deviceId: string) => {
    handleDelete(deviceId, `Bạn có chắc chắn muốn xóa thiết bị mã ${deviceId}?`);
  };

 

  

  const uniqueRooms = Array.from(new Set(devices.map(device => device.room)));
  const filteredDevices = filterRoom === 'All' ? devices : devices.filter(device => device.room === filterRoom);
  return (
    <MainLayout>

      <PageHeader
        title="Danh mục thiết bị"
        description="Quản lý toàn bộ tài sản và thiết bị phòng học của HVCS"
        action={
          <button
            onClick={handleOpenAdd}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            <FiPlus className="mr-2 text-lg" /> Thêm thiết bị mới
          </button>
        }
      />

      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('all')} className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <FiBox className="mr-2 text-lg" /> Tất cả thiết bị
          </button>
          <button onClick={() => setActiveTab('byRoom')} className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'byRoom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <FiLayers className="mr-2 text-lg" /> Quản lý theo phòng học
          </button>
        </nav>
      </div>

      {activeTab === 'all' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <FilterSelect
            value={filterRoom}
            onChange={setFilterRoom}
            options={uniqueRooms}
            defaultLabel="Tất cả phòng học"
            optionPrefix="Phòng "
          />

          <Table 
        data={filteredDevices}
        columns={deviceColumns}
        onEdit={handleOpenEdit}
        onDelete={(deviceId) => handleDelete(deviceId, `Xóa thiết bị ${deviceId}?`)}
        emptyMessage="Không tìm thấy thiết bị nào."
      />
        </div>
      ) : (
        <Grid
          devices={devices}
          uniqueRooms={uniqueRooms}
          getStatusStyle={getStatusStyle}
          onEdit={handleOpenEdit}
          onDelete={(deviceId) => handleDelete(deviceId, `Bạn có chắc chắn muốn xóa thiết bị mã ${deviceId}?`)}
        />
      )}

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDevice}
        initialData={editingDevice}
        fields={deviceFields}
        titleAdd="Thêm thiết bị mới"
        titleEdit={`Cập nhật thiết bị - ${editingDevice?.id}`}
      />
    </MainLayout>
  );
};