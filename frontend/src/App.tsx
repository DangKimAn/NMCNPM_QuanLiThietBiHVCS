import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

import { DeviceManager } from './pages/devices/DeviceManager';
import { ManagerOverview } from './pages/manager/ManagerOverview';
import { IncidentManager } from './components/manager/IncidentManager';

import { UserManager } from './pages/admin/UserManager';
import { RolePermissionManager } from './pages/admin/RolePermissionManager';
import { SystemLogViewer } from './pages/admin/SystemLogView';

import { StudentReport } from './pages/student/StudentReport';
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentMyReports } from './pages/student/StudentMyReports';

function App() {
  return (
    <Router>
      <Routes>
        {/* Mặc định vào trang đăng nhập */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Cán bộ quản lý thiết bị */}
        <Route path="/manager/overview" element={<ManagerOverview />} />
        <Route path="/manager/devices" element={<DeviceManager />} />
        <Route path="/manager/incidents" element={<IncidentManager />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<UserManager />} />
        <Route path="/admin/roles" element={<RolePermissionManager />} />
        <Route path="/admin/logs" element={<SystemLogViewer />} />

        {/* Giảng viên / Sinh viên */}
        <Route path="/student/overview" element={<StudentOverview />} />
        <Route path="/student/reports" element={<StudentReport />} />
        <Route path="/student/my-reports" element={<StudentMyReports />} />

        {/* Nếu nhập sai đường dẫn thì quay về login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;