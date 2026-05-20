import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';

import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  Modal,
  SummaryCard,
  TableHead,
} from '../../components/manager/common/ManagerCommon';

interface AdminPermission {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

interface AdminRole {
  id: number;
  name: string;
  description?: string;
  permissions: AdminPermission[];
}

interface RoleForm {
  id?: number;
  name: string;
  description: string;
  permissionIds: number[];
}

const initialPermissions: AdminPermission[] = [
  {
    id: 1,
    name: 'Quản lý tài khoản',
    code: 'MANAGE_USERS',
    description: 'Thêm, sửa, khóa và xóa tài khoản người dùng',
  },
  {
    id: 2,
    name: 'Phân quyền',
    code: 'MANAGE_ROLES',
    description: 'Quản lý vai trò và quyền truy cập',
  },
  {
    id: 3,
    name: 'Xem nhật ký hệ thống',
    code: 'VIEW_LOGS',
    description: 'Theo dõi lịch sử thao tác trong hệ thống',
  },
  {
    id: 4,
    name: 'Quản lý thiết bị',
    code: 'MANAGE_EQUIPMENT',
    description: 'Quản lý danh mục, trạng thái và điều chuyển thiết bị',
  },
  {
    id: 5,
    name: 'Xử lý phản ánh',
    code: 'HANDLE_REPORTS',
    description: 'Tiếp nhận và cập nhật trạng thái phản ánh sự cố',
  },
  {
    id: 6,
    name: 'Gửi phản ánh',
    code: 'CREATE_REPORT',
    description: 'Gửi phản ánh báo hỏng thiết bị phòng học',
  },
];

const initialRoles: AdminRole[] = [
  {
    id: 1,
    name: 'Quản trị viên',
    description: 'Có toàn quyền quản lý hệ thống',
    permissions: initialPermissions,
  },
  {
    id: 2,
    name: 'Cán bộ QLTB',
    description: 'Quản lý thiết bị, điều chuyển thiết bị và xử lý phản ánh',
    permissions: initialPermissions.filter((permission) =>
      ['MANAGE_EQUIPMENT', 'HANDLE_REPORTS'].includes(permission.code || ''),
    ),
  },
  {
    id: 3,
    name: 'Giảng viên',
    description: 'Gửi phản ánh và theo dõi phản ánh đã gửi',
    permissions: initialPermissions.filter((permission) =>
      ['CREATE_REPORT'].includes(permission.code || ''),
    ),
  },
  {
    id: 4,
    name: 'Sinh viên',
    description: 'Gửi phản ánh và theo dõi phản ánh đã gửi',
    permissions: initialPermissions.filter((permission) =>
      ['CREATE_REPORT'].includes(permission.code || ''),
    ),
  },
];

const emptyForm: RoleForm = {
  name: '',
  description: '',
  permissionIds: [],
};

export const RolePermissionManager = () => {
  const [roles, setRoles] = useState<AdminRole[]>(initialRoles);
  const [permissions] = useState<AdminPermission[]>(initialPermissions);

  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyForm);

  useEffect(() => {
    setLoading(false);
  }, []);

  const filteredRoles = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    return roles.filter((role) => {
      if (!value) return true;

      return (
        role.name.toLowerCase().includes(value) ||
        role.description?.toLowerCase().includes(value) ||
        role.permissions.some((permission) =>
          permission.name.toLowerCase().includes(value),
        )
      );
    });
  }, [roles, keyword]);

  const openAddModal = () => {
    setRoleForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (role: AdminRole) => {
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map((permission) => permission.id),
    });

    setIsModalOpen(true);
  };

  const togglePermission = (permissionId: number) => {
    const exists = roleForm.permissionIds.includes(permissionId);

    setRoleForm({
      ...roleForm,
      permissionIds: exists
        ? roleForm.permissionIds.filter((id) => id !== permissionId)
        : [...roleForm.permissionIds, permissionId],
    });
  };

  const saveRole = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!roleForm.name.trim()) {
      alert('Vui lòng nhập tên vai trò.');
      return;
    }

    const selectedPermissions = permissions.filter((permission) =>
      roleForm.permissionIds.includes(permission.id),
    );

    if (roleForm.id) {
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === roleForm.id
            ? {
                ...role,
                name: roleForm.name,
                description: roleForm.description,
                permissions: selectedPermissions,
              }
            : role,
        ),
      );
    } else {
      const newRole: AdminRole = {
        id: roles.length > 0 ? Math.max(...roles.map((role) => role.id)) + 1 : 1,
        name: roleForm.name,
        description: roleForm.description,
        permissions: selectedPermissions,
      };

      setRoles((prevRoles) => [...prevRoles, newRole]);
    }

    setIsModalOpen(false);
  };

  const deleteRole = (role: AdminRole) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`,
    );

    if (!confirmDelete) return;

    setRoles((prevRoles) => prevRoles.filter((item) => item.id !== role.id));
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Phân quyền hệ thống
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Quản lý vai trò và các quyền được gán cho từng vai trò trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          Thêm vai trò
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={<FiUsers />} label="Tổng vai trò" value={roles.length} />

        <SummaryCard
          icon={<FiShield />}
          label="Tổng quyền"
          value={permissions.length}
        />

        <SummaryCard
          icon={<FiShield />}
          label="Vai trò có quyền"
          value={roles.filter((role) => role.permissions.length > 0).length}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm vai trò, quyền..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Đang tải dữ liệu phân quyền...
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Quyền được cấp</TableHead>
                  <TableHead alignRight>Thao tác</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{role.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID: {role.id}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {role.description || 'Không có mô tả'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.length === 0 && (
                          <span className="text-sm text-slate-400">
                            Chưa gán quyền
                          </span>
                        )}

                        {role.permissions.map((permission) => (
                          <span
                            key={permission.id}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100"
                          >
                            {permission.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(role)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Sửa vai trò"
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRole(role)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Xóa vai trò"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRoles.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      Không tìm thấy vai trò phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={roleForm.id ? 'Cập nhật vai trò' : 'Thêm vai trò mới'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={saveRole}
          submitText={roleForm.id ? 'Cập nhật' : 'Thêm mới'}
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Tên vai trò
            </label>

            <input
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  name: e.target.value,
                })
              }
              placeholder="Ví dụ: Quản trị viên, Cán bộ QLTB..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Mô tả
            </label>

            <textarea
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  description: e.target.value,
                })
              }
              rows={3}
              placeholder="Nhập mô tả vai trò..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Danh sách quyền
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={roleForm.permissionIds.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      {permission.name}
                    </span>

                    {permission.description && (
                      <span className="block text-xs text-slate-400 mt-0.5">
                        {permission.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default RolePermissionManager;