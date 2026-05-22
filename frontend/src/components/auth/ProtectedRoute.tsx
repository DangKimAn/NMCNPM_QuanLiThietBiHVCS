import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ allowedRoles }) => {
  const accessToken = localStorage.getItem('accessToken');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 1. Nếu chưa đăng nhập, đá văng về trang login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Chuẩn hóa role của user hiện tại sang chữ IN HOA để so sánh chính xác
  const userRole = user?.role ? user.role.toUpperCase() : null;
  
  // Lấy đường dẫn hiện tại trình duyệt đang đứng
  const currentPath = window.location.pathname.toLowerCase();

  // 2. Nếu route yêu cầu phân quyền cụ thể (allowedRoles)
  if (allowedRoles) {
    const upperAllowedRoles = allowedRoles.map(role => role.toUpperCase());

    // Nếu Role của user hợp lệ, cho phép đi tiếp vào luôn trang con
    if (userRole && upperAllowedRoles.includes(userRole)) {
      return <Outlet />;
    }

    // --- XỬ LÝ KHI SAI QUYỀN (ĐIỀU HƯỚNG AN TOÀN - CHỐNG LẶP VÔ HẠN) ---
    
    if (userRole === 'ADMIN') {
      if (currentPath === '/admin') return <Outlet />; // Đang ở đúng trang thì dừng lại hiển thị giao diện
      return <Navigate to="/admin" replace />;
    }
    
    if (userRole === 'MANAGER') {
      if (currentPath === '/manager') return <Outlet />;
      return <Navigate to="/manager" replace />;
    }
    
    if (userRole === 'STUDENT' || userRole === 'TEACHER') {
      // Nếu đang đứng ở trang /student rồi thì KHÔNG ĐƯỢC điều hướng tiếp, ép hiển thị giao diện ra luôn
      if (currentPath === '/student') return <Outlet />; 
      return <Navigate to="/student" replace />;
    }
    
    // Nếu role lạ lẫm không thuộc các nhóm trên, clear bộ nhớ và đẩy về Login
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Nếu route không yêu cầu allowedRoles (route tự do nhưng cần đăng nhập), cho qua luôn
  return <Outlet />;
};