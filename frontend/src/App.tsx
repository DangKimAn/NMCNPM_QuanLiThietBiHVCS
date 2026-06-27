import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));

const DeviceManager = lazy(() => import('./pages/devices/DeviceManager').then(m => ({ default: m.DeviceManager })));
const ManagerOverview = lazy(() => import('./pages/manager/ManagerOverview').then(m => ({ default: m.ManagerOverview })));
const IncidentManager = lazy(() => import('./components/manager/IncidentManager').then(m => ({ default: m.IncidentManager })));

const UserManager = lazy(() => import('./pages/admin/UserManager').then(m => ({ default: m.UserManager })));
const RolePermissionManager = lazy(() => import('./pages/admin/RolePermissionManager').then(m => ({ default: m.RolePermissionManager })));
const SystemLogViewer = lazy(() => import('./pages/admin/SystemLogView').then(m => ({ default: m.SystemLogViewer })));
const FormConfigPage = lazy(() => import('./pages/admin/FormConfigPage').then(m => ({ default: m.FormConfigPage })));

const StudentReport = lazy(() => import('./pages/student/StudentReport').then(m => ({ default: m.StudentReport })));
const StudentOverview = lazy(() => import('./pages/student/StudentOverview').then(m => ({ default: m.StudentOverview })));
const StudentMyReports = lazy(() => import('./pages/student/StudentMyReports').then(m => ({ default: m.StudentMyReports })));
const StudentRoomEquipment = lazy(() => import('./pages/student/StudentRoomEquipment').then(m => ({ default: m.StudentRoomEquipment })));

const NotificationPage = lazy(() => import('./pages/notifications/NotificationPage'));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Mặc định vào trang đăng nhập */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Trang thông báo dùng chung cho tất cả role */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']}
              />
            }
          >
            <Route path="/notifications" element={<NotificationPage />} />
          </Route>

          {/* Cán bộ quản lý thiết bị */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />
            }
          >
            <Route
              path="/manager"
              element={<Navigate to="/manager/overview" replace />}
            />
            <Route path="/manager/overview" element={<ManagerOverview />} />
            <Route path="/manager/devices" element={<DeviceManager />} />
            <Route path="/manager/incidents" element={<IncidentManager />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/users" element={<UserManager />} />
            <Route path="/admin/roles" element={<RolePermissionManager />} />
            <Route path="/admin/logs" element={<SystemLogViewer />} />
            <Route path="/admin/form-config" element={<FormConfigPage />} />
          </Route>

          {/* Giảng viên / Sinh viên */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['TEACHER', 'STUDENT', 'MANAGER', 'ADMIN']}
              />
            }
          >
            <Route
              path="/student"
              element={<Navigate to="/student/overview" replace />}
            />
            <Route path="/student/overview" element={<StudentOverview />} />
            <Route path="/student/reports" element={<StudentReport />} />
            <Route path="/student/my-reports" element={<StudentMyReports />} />
            <Route path="/student/rooms" element={<StudentRoomEquipment />} />
          </Route>

          {/* Sai đường dẫn thì quay về login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
