import { useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FiUserPlus, FiEdit2, FiLock, FiTrash2 } from 'react-icons/fi';
import { DynamicFormModal } from '../../components/ui/DynamicFormModal';
import { PageHeader } from '../../components/ui/PageHeader';
import type { FormField } from '../../components/ui/DynamicFormModal';
import { useCrud } from '../../hooks/useCrud';
import type { TableColumn } from '../../components/ui/Table';
import { Table } from '../../components/ui/Table';
// ĐỊNH NGHĨA CÁC CỘT CỦA TÀI KHOẢN CHO FORM ĐỘNG
const userFields: FormField[] = [
  { name: 'id', label: 'Mã người dùng', type: 'text', required: true, readOnlyOnEdit: true },
  { name: 'username', label: 'Tên đăng nhập', type: 'text', required: true, readOnlyOnEdit: true },
  { name: 'fullName', label: 'Họ và tên', type: 'text', required: true, fullWidth: true },
  { name: 'role', label: 'Vai trò', type: 'select', options: ['Quản trị viên', 'Cán bộ QLTB', 'Giảng viên', 'Sinh viên'], defaultValue: 'Sinh viên' },
  { name: 'status', label: 'Trạng thái', type: 'select', options: ['Hoạt động', 'Đã khóa'], defaultValue: 'Hoạt động' }
];

// 2. DỮ LIỆU KHỞI TẠO
const initialUsers = [
  { id: 'NV001', username: 'admin_hethong', fullName: 'Nguyễn Văn A', role: 'Quản trị viên', status: 'Hoạt động' },
  { id: 'NV002', username: 'cb_thietbi1', fullName: 'Trần Thị B', role: 'Cán bộ QLTB', status: 'Hoạt động' },
  { id: 'GV001', username: 'gv_toancc', fullName: 'Lê Văn C', role: 'Giảng viên', status: 'Hoạt động' },
  { id: 'SV001', username: 'sv_cntt01', fullName: 'Phạm Văn D', role: 'Sinh viên', status: 'Đã khóa' },
];

const userColumns: TableColumn[] = [
  { header: 'Mã ND', key: 'id', render: (item) => <span className="font-medium text-slate-900">{item.id}</span> },
  { header: 'Tên đăng nhập', key: 'username', render: (item) => <span className="font-medium text-indigo-600">{item.username}</span> },
  { header: 'Họ và tên', key: 'fullName', render: (item) => <span className="text-slate-700">{item.fullName}</span> },
  {
    header: 'Vai trò', key: 'role', render: (item) => (
      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-medium border border-indigo-100">
        {item.role}
      </span>
    )
  },
  {
    header: 'Trạng thái', key: 'status', render: (item) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${item.status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
        {item.status}
      </span>
    )
  }
];

export const UserManager = () => {

  const {
    data: users,
    isModalOpen,
    editingItem: editingUser,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    setIsModalOpen,
    handleSave: handleSaveUser,
    handleDelete
  } = useCrud(initialUsers, 'id');


  const onDeleteUser = (userId: string,) => {
    // Tận dụng hàm handleDelete từ hook, chỉ cần truyền thêm câu hỏi xác nhận
    handleDelete(userId, `Bạn có chắc chắn muốn xóa tài khoản ?`);
  };

  const handleResetPassword = (username: string) => {
    const isConfirm = window.confirm(`Xác nhận đặt lại mật khẩu mặc định cho tài khoản "${username}"?`);
    if (isConfirm) {
      alert(`Đã đặt lại mật khẩu cho ${username} thành công!`);
    }
  };
  return (
    <MainLayout>
      <PageHeader
        title="Quản lý tài khoản"
        description="Phân quyền và quản lý người dùng trong hệ thống HVCS"
        action={
          <button
            onClick={handleOpenAdd}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            <FiUserPlus className="mr-2 text-lg" /> Thêm tài khoản
          </button>
        }
      />

      {/* 2. GỌI SIÊU BẢNG VỚI NÚT CUSTOM */}
      <Table
        data={users}
        columns={userColumns}
        onEdit={handleOpenEdit}
        onDelete={onDeleteUser}
        emptyMessage="Không có tài khoản nào trong hệ thống."
      />

      {/* FORM ĐỘNG */}
      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        initialData={editingUser}
        fields={userFields}
        titleAdd="Thêm tài khoản mới"
        titleEdit={editingUser ? `Cập nhật tài khoản - ${editingUser.username}` : ''}
      />
    </MainLayout>
  );
};