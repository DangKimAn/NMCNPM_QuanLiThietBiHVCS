import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { DeviceManager } from './pages/devices/DeviceManager';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { UserManager } from './pages/admin/UserManager';
import { StudentReport } from './pages/student/StudentReport';
import { IncidentManager } from './components/manager/IncidentManager';
import { SystemLogViewer } from './pages/admin/SystemLogView';
import { ManagerOverview } from './pages/manager/ManagerOverview';

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
        <Route path="/admin/users" element={<UserManager />} />
        <Route path="/admin/logs" element={<SystemLogViewer />} />

        {/* Giảng viên / Sinh viên */}
        <Route path="/student/reports" element={<StudentReport />} />
      </Routes>
    </Router>
  );
}

export default App;