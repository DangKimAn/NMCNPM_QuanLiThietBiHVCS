import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Danh sách các quyền được phép truy cập (VD: ['ADMIN', 'MANAGER'])
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const accessToken = localStorage.getItem('accessToken');
  // Lấy thông tin user (được lưu lại khi đăng nhập thành công)
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 1. Nếu chưa đăng nhập, đá văng về trang login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu có yêu cầu phân quyền cụ thể, check quyền của user
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // Không có quyền thì đá về trang mặc định theo role thực tế của họ
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/student" replace />;
  }

  // Nếu thỏa mãn hết điều kiện, cho phép đi tiếp vào các trang con
  return <Outlet />;
};