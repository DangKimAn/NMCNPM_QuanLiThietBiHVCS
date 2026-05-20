import type { ReactNode } from 'react';
import { ManagerLayout } from './ManagerLayout';

interface MainLayoutProps {
  children: ReactNode;
}

// MainLayout tạm thời trỏ về ManagerLayout để các file cũ không bị lỗi import.
// Sau này có thể đổi từng trang sang import trực tiếp ManagerLayout.
export const MainLayout = ({ children }: MainLayoutProps) => {
  return <ManagerLayout>{children}</ManagerLayout>;
};

export default MainLayout;