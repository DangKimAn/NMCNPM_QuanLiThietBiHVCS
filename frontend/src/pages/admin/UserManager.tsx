import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { FiUserPlus, FiUpload, FiSearch, FiX } from 'react-icons/fi';
import { DynamicFormModal } from '../../components/ui/DynamicFormModal';
import { UserImportExcelModal } from './UserImportExcelModal';
import { PageHeader } from '../../components/ui/PageHeader';
import type { FormField } from '../../components/ui/DynamicFormModal';
import { Table, type TableColumn } from '../../components/ui/Table';
import { adminApi, toBackendStatus } from '../../services/adminApi';
import type { AdminUser } from '../../services/adminApi';

const userFields: FormField[] = [
  {
    name: 'fullName',
    label: 'Họ và tên',
    type: 'text',
    required: true,
  },
  {
    name: 'username',
    label: 'Tên đăng nhập',
    type: 'text',
    required: true,
    readOnlyOnEdit: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    required: true,
    readOnlyOnEdit: true,
  },
  {
    name: 'password',
    label: 'Mật khẩu',
    type: 'text',
  },
  {
    name: 'phoneNumber',
    label: 'Số điện thoại',
    type: 'text',
  },
  {
    name: 'role',
    label: 'Vai trò',
    type: 'select',
    options: ['ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'],
    defaultValue: 'STUDENT',
    readOnlyOnEdit: true,
  },
  {
    name: 'status',
    label: 'Trạng thái',
    type: 'select',
    options: ['Hoạt động', 'Đã khóa'],
    defaultValue: 'Hoạt động',
  },
];

const userColumns: TableColumn[] = [
  {
    header: 'Mã ND',
    key: 'id',
    render: (item) => (
      <span className="font-medium text-slate-900">{item.id}</span>
    ),
  },
  {
    header: 'Họ và tên',
    key: 'fullName',
    render: (item) => (
      <span className="font-medium text-slate-900">
        {item.fullName || 'Chưa cập nhật'}
      </span>
    ),
  },
  {
    header: 'Tên đăng nhập',
    key: 'username',
    render: (item) => (
      <span className="font-medium text-indigo-600">{item.username}</span>
    ),
  },
  {
    header: 'Email',
    key: 'email',
    render: (item) => <span className="text-slate-700">{item.email}</span>,
  },
  {
    header: 'Vai trò',
    key: 'role',
    render: (item) => (
      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-medium border border-indigo-100 whitespace-nowrap">
        {item.role}
      </span>
    ),
  },
  {
    header: 'Trạng thái',
    key: 'status',
    render: (item) => (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${item.status === 'Hoạt động'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
      >
        {item.status}
      </span>
    ),
  },
];

export const UserManager = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchKeyword(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(val);
    }, 500);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadUsers('');
  };

  const loadUsers = async (keyword?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = keyword && keyword.trim()
        ? await adminApi.searchUsers(keyword.trim())
        : await adminApi.getUsers();
      setUsers(data);
      setCurrentPage(1);
    } catch (err) {
      setError('Không thể tải danh sách tài khoản. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: Record<string, any>) => {
    try {
      if (editingUser) {
        const payload: Record<string, any> = {};

        if (formData.fullName !== undefined) {
          payload.fullName = String(formData.fullName).trim();
        }

        if (formData.password) {
          payload.password = formData.password;
        }

        if (formData.phoneNumber !== undefined) {
          payload.phoneNumber = formData.phoneNumber;
        }

        if (formData.status) {
          payload.status = toBackendStatus(formData.status as string);
        }

        await adminApi.updateUser(editingUser.userId, payload);

        if (formData.role && formData.role !== editingUser.role) {
          await adminApi.changeUserRole(
            editingUser.userId,
            formData.role as string,
          );
        }
      } else {
        if (
          !formData.fullName ||
          !formData.email ||
          !formData.username ||
          !formData.password
        ) {
          alert(
            'Vui lòng điền đầy đủ họ tên, email, tên đăng nhập và mật khẩu.',
          );
          return;
        }

        await adminApi.createUser({
          fullName: String(formData.fullName).trim(),
          email: formData.email as string,
          username: formData.username as string,
          password: formData.password as string,
          phoneNumber: formData.phoneNumber as string | undefined,
          roleName: formData.role as string,
        });
      }

      if (editingUser) {
        setIsModalOpen(false);
        alert('Cập nhật tài khoản thành công!');
      } else {
        alert('Thêm tài khoản thành công! Các trường dữ liệu đã được làm mới để nhập tiếp.');
      }

      await loadUsers();
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể lưu tài khoản'}`);
      throw err; // Ném lỗi để DynamicFormModal bắt và không xóa form
    }
  };

  const handleDelete = async (userId: string) => {
    const isConfirm = window.confirm(
      'Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không? Dữ liệu liên quan của tài khoản cũng sẽ bị xóa.',
    );

    if (!isConfirm) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      await adminApi.deleteUser(user.userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('Xóa tài khoản thành công!');
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể xóa tài khoản'}`);
    }
  };

  // Sắp xếp: updatedAt giảm dần, fallback createdAt giảm dần
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [users]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = sortedUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý tài khoản"
        description="Phân quyền và quản lý người dùng trong hệ thống HVCS"
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
            >
              <FiUpload className="mr-2 text-lg" />
              Import Excel
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
            >
              <FiUserPlus className="mr-2 text-lg" />
              Thêm tài khoản
            </button>
          </div>
        }
      />

      {/* Ô tìm kiếm */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            id="user-search-input"
            type="text"
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo tên, email hoặc tên đăng nhập..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Xoá tìm kiếm"
            >
              <FiX />
            </button>
          )}
        </div>
        {searchKeyword && !loading && (
          <span className="text-sm text-slate-500">
            Tìm thấy <span className="font-semibold text-indigo-600">{sortedUsers.length}</span> kết quả
          </span>
        )}
      </div>
  {
    loading && (
      <div className="text-center py-10 text-slate-500">
        Đang tải dữ liệu...
      </div>
    )
  }

  {
    error && (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-4">
        {error}
        <button
          type="button"
          onClick={loadUsers}
          className="ml-3 text-sm underline"
        >
          Thử lại
        </button>
      </div>
    )
  }

  {
    !loading && !error && (
        <>
          {/* Pagination bar - luôn nằm trên bảng */}
          {totalPages > 1 && (() => {
            // Smart window: hiển thị tối đa 5 số trang
            const pages: (number | '...')[] = [];
            const delta = 2; // số trang mỗi bên của trang hiện tại
            const left = safePage - delta;
            const right = safePage + delta;

            if (left > 2) {
              pages.push(1, '...');
            } else {
              for (let i = 1; i < left; i++) pages.push(i);
            }

            for (let i = Math.max(1, left); i <= Math.min(totalPages, right); i++) {
              pages.push(i);
            }

            if (right < totalPages - 1) {
              pages.push('...', totalPages);
            } else {
              for (let i = right + 1; i <= totalPages; i++) pages.push(i);
            }

            return (
              <div className="mb-3 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trước
                </button>

                {pages.map((page, idx) =>
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page as number)}
                      className={`h-8 w-8 rounded-lg border text-sm font-medium ${
                        page === safePage
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            );
          })()}

          <Table
            data={pagedUsers}
            columns={userColumns}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            emptyMessage={
              searchKeyword
                ? `Không tìm thấy tài khoản nào khớp với "${searchKeyword}".`
                : 'Không có tài khoản nào trong hệ thống.'
            }
            mobilePrimaryColumnKey="fullName"
            mobileSecondaryColumnKey="email"
          />

          {/* Pagination dưới */}
          {totalPages > 1 && (() => {
            const pages: (number | '...')[] = [];
            const delta = 2;
            const left = safePage - delta;
            const right = safePage + delta;
            if (left > 2) { pages.push(1, '...'); } else { for (let i = 1; i < left; i++) pages.push(i); }
            for (let i = Math.max(1, left); i <= Math.min(totalPages, right); i++) pages.push(i);
            if (right < totalPages - 1) { pages.push('...', totalPages); } else { for (let i = right + 1; i <= totalPages; i++) pages.push(i); }
            return (
              <div className="mt-3 flex items-center justify-end gap-1">
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                  ← Trước
                </button>
                {pages.map((page, idx) =>
                  page === '...' ? (
                    <span key={`b-dots-${idx}`} className="px-1 text-slate-400 select-none">...</span>
                  ) : (
                    <button key={`b-${page}`} type="button" onClick={() => setCurrentPage(page as number)}
                      className={`h-8 w-8 rounded-lg border text-sm font-medium ${page === safePage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {page}
                    </button>
                  )
                )}
                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Sau →
                </button>
              </div>
            );
          })()}
        </>
      )}


      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingUser}
        fields={userFields}
        titleAdd="Thêm tài khoản mới"
        titleEdit={
          editingUser
            ? `Cập nhật tài khoản - ${editingUser.username}`
            : ''
        }
      />

      <UserImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadUsers}
      />
    </AdminLayout >
  );
};

export default UserManager;