import type { ReactNode } from 'react';
import {
  FiBox,
  FiHome,
  FiTool,
} from 'react-icons/fi';

import { AppLayoutBase } from './AppLayoutBase';
import type { LayoutMenuItem } from './AppLayoutBase';

interface ManagerLayoutProps {
  children: ReactNode;
}

// Menu dành cho Cán bộ quản lý thiết bị
const managerMenuItems: LayoutMenuItem[] = [
  {
    label: 'Tổng quan',
    icon: <FiHome />,
    path: '/manager/overview',
  },
  {
    label: 'Quản lý thiết bị',
    icon: <FiBox />,
    path: '/manager/devices',
  },
  {
    label: 'Phản ánh sự cố',
    icon: <FiTool />,
    path: '/manager/incidents',
  },
];

export const ManagerLayout = ({ children }: ManagerLayoutProps) => {
  return (
    <AppLayoutBase
      menuTitle="Menu cán bộ quản lý"
      menuItems={managerMenuItems}
      homePath="/manager/overview"
      searchPlaceholder="Tìm kiếm thiết bị, phòng học..."
      onSearch={(keyword) => `/manager/devices?keyword=${encodeURIComponent(keyword)}`}
    >
      {children}
    </AppLayoutBase>
  );
};

export default ManagerLayout;