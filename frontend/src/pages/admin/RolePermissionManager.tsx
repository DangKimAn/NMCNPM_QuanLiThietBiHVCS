import { useEffect, useMemo, useState, useRef } from 'react';
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
import { adminApi } from '../../services/adminApi';
import type { BackendRole, BackendPermission } from '../../services/adminApi';

// Frontend type dùng trong UI
interface AdminRole {
  id: number;
  name: string;
  description?: string;
  permissions: AdminPermission[];
}

interface AdminPermission {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

interface RoleForm {
  id?: number;
  name: string;
  description: string;
  permissionIds: number[];
}

const emptyForm: RoleForm = {
  name: '',
  description: '',
  permissionIds: [],
};

// Map backend → frontend
const mapBackendRole = (r: BackendRole): AdminRole => ({
  id: r.roleId,
  name: r.roleName,
  description: r.description ?? '',
  permissions: (r.permissions ?? []).map((p) => ({
    id: p.permissionId,
    name: p.permissionName,
    description: p.description ?? '',
  })),
});

const mapBackendPermission = (p: BackendPermission): AdminPermission => ({
  id: p.permissionId,
  name: p.permissionName,
  description: p.description ?? '',
});

export const RolePermissionManager = () => {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);

  const [keyword, setKeyword] = useState('');
  const keywordTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, permsData] = await Promise.all([
        adminApi.getRoles(),
        adminApi.getPermissions(),
      ]);
      setRoles(rolesData.map(mapBackendRole));
      setPermissions(permsData.map(mapBackendPermission));
    } catch (err: any) {
      setError('Không thể tải dữ liệu phân quyền. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRoles = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    return roles.filter((role) => {
      if (!value) return true;
      return (
        role.name.toLowerCase().includes(value) ||
        role.description?.toLowerCase().includes(value) ||
        role.permissions.some((p) => p.name.toLowerCase().includes(value))
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
      permissionIds: role.permissions.map((p) => p.id),
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

  const saveRole = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      alert('Vui lòng nhập tên vai trò.');
      return;
    }

    try {
      if (roleForm.id) {
        // Cập nhật role
        await adminApi.updateRole(roleForm.id, {
          roleName: roleForm.name,
          description: roleForm.description,
        });
        // Cập nhật local state (permissions chưa có API remove riêng nên chỉ cập nhật tên/mô tả)
        const selectedPermissions = permissions.filter((p) =>
          roleForm.permissionIds.includes(p.id),
        );
        setRoles((prev) =>
          prev.map((role) =>
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
        // Tạo role mới
        const newRole = await adminApi.createRole({
          roleName: roleForm.name,
          description: roleForm.description,
        });
        // Thêm permissions cho role mới
        for (const permissionId of roleForm.permissionIds) {
          await adminApi.addPermissionToRole(newRole.roleId, permissionId);
        }
        await loadData(); // Reload để lấy dữ liệu mới nhất
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể lưu vai trò'}`);
    }
  };

  const deleteRole = async (role: AdminRole) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`,
    );
    if (!confirmDelete) return;

    try {
      await adminApi.deleteRole(role.id);
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể xóa vai trò'}`);
    }
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
        <SummaryCard icon={<FiShield />} label="Tổng quyền" value={permissions.length} />
        <SummaryCard
          icon={<FiShield />}
          label="Vai trò có quyền"
          value={roles.filter((r) => r.permissions.length > 0).length}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => {
              if (keywordTimeoutRef.current) clearTimeout(keywordTimeoutRef.current);
              keywordTimeoutRef.current = setTimeout(() => setKeyword(e.target.value), 300);
            }}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-4">
          {error}
          <button type="button" onClick={loadData} className="ml-3 text-sm underline">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
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
                        {role.permissions.map((perm) => (
                          <span
                            key={perm.id}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100"
                          >
                            {perm.name}
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
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
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
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="Ví dụ: ADMIN, MANAGER..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
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
              {permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={roleForm.permissionIds.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      {perm.name}
                    </span>
                    {perm.description && (
                      <span className="block text-xs text-slate-400 mt-0.5">
                        {perm.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
              {permissions.length === 0 && (
                <p className="text-sm text-slate-400 col-span-2">
                  Không có quyền nào trong hệ thống.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default RolePermissionManager;