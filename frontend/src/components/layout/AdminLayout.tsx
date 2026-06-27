import type { ReactNode } from 'react';
import {
  FiBell,
  FiFileText,
  FiShield,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';

import { AppLayoutBase } from './AppLayoutBase';
import type { LayoutMenuItem } from './AppLayoutBase';

interface AdminLayoutProps {
  children: ReactNode;
}

// Menu dành cho Quản trị viên
const adminMenuItems: LayoutMenuItem[] = [
  {
    label: 'Quản lý tài khoản',
    icon: <FiUsers />,
    path: '/admin/users',
  },
  {
    label: 'Phân quyền',
    icon: <FiShield />,
    path: '/admin/roles',
  },
  {
    label: 'Nhật ký hệ thống',
    icon: <FiFileText />,
    path: '/admin/logs',
  },
  {
    label: 'Cấu hình Form',
    icon: <FiSettings />,
    path: '/admin/form-config',
  },
  {
    label: 'Thông báo',
    icon: <FiBell />,
    path: '/notifications',
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AppLayoutBase
      menuTitle="Menu quản trị viên"
      menuItems={adminMenuItems}
      homePath="/admin/users"
      searchPlaceholder="Tìm kiếm tài khoản, vai trò..."
      onSearch={(keyword) => `/admin/users?keyword=${encodeURIComponent(keyword)}`}
    >
      {children}
    </AppLayoutBase>
  );
};

export default AdminLayout;