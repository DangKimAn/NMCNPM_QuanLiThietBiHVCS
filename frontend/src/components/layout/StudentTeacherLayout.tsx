import type { ReactNode } from 'react';
import {
  FiEdit3,
  FiFileText,
  FiHome,
} from 'react-icons/fi';

import { AppLayoutBase } from './AppLayoutBase';
import type { LayoutMenuItem } from './AppLayoutBase';

interface StudentTeacherLayoutProps {
  children: ReactNode;
}

// Menu dành cho Sinh viên / Giảng viên
const studentTeacherMenuItems: LayoutMenuItem[] = [
  {
    label: 'Tổng quan',
    icon: <FiHome />,
    path: '/student/overview',
  },
  {
    label: 'Gửi phản ánh',
    icon: <FiEdit3 />,
    path: '/student/reports',
  },
  {
    label: 'Phản ánh của tôi',
    icon: <FiFileText />,
    path: '/student/my-reports',
  },
];

export const StudentTeacherLayout = ({ children }: StudentTeacherLayoutProps) => {
  return (
    <AppLayoutBase
      menuTitle="Menu người dùng"
      menuItems={studentTeacherMenuItems}
      homePath="/student/reports"
      searchPlaceholder="Tìm kiếm phản ánh của tôi..."
      onSearch={(keyword) => `/student/my-reports?keyword=${encodeURIComponent(keyword)}`}
    >
      {children}
    </AppLayoutBase>
  );
};

export default StudentTeacherLayout;