import { useState, useEffect } from 'react';
import { FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom'; // 👈 Thêm hook điều hướng
import axios from 'axios'; // 👈 Thêm axios để gọi API
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputGroup } from '../../components/ui/InputGroup';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // 👈 State để hứng lỗi hiển thị ra màn hình
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // 👈 Khởi tạo navigate
  const location = useLocation();

  useEffect(() => {
    // Bắt query params nếu được redirect từ Google Auth về
    const queryParams = new URLSearchParams(location.search);
    const urlAccessToken = queryParams.get('accessToken');
    const urlRefreshToken = queryParams.get('refreshToken');

    if (urlAccessToken && urlRefreshToken) {
      // Lưu token
      localStorage.setItem('accessToken', urlAccessToken);
      localStorage.setItem('refreshToken', urlRefreshToken);

      // Giải mã JWT
      const base64Url = urlAccessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64)); 
      
      localStorage.setItem('user', JSON.stringify({
        userId: payload.sub,
        username: payload.username,
        role: payload.role || 'USER'
      }));

      // Điều hướng
      const userRole = payload.role || 'USER';
      if (userRole === 'ADMIN') {
        navigate('/admin/users');
      } else if (userRole === 'MANAGER' || userRole === 'LEADER') {
        navigate('/manager/overview');
      } else {
        navigate('/student/overview');
      }
    }

    const urlError = queryParams.get('error');
    if (urlError) {
      setError(urlError);
      // Xóa query param trên thanh URL để đẹp mắt hơn
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Gọi API đăng nhập đến NestJS (Đổi lại port nếu Back-end của bạn chạy port khác)
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        usernameOrEmail: username,
        password: password,
      });

      // 2. Nhận tokens trả về từ Back-end
      const { accessToken, refreshToken } = response.data;

      // 3. Lưu tokens vào bộ nhớ trình duyệt
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // 4. Giải mã payload của JWT để biết Role (Hoặc nếu API của bạn trả về object user thì dùng luôn)
      // Ở đây tạm thời giải mã nhanh thông tin từ accessToken để lấy vai trò người dùng
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64)); 
      
      // Giả sử payload chứa { sub: userId, username: '...', role: 'ADMIN' | 'MANAGER' | 'USER' }
      // Lưu thông tin user để dùng cho ProtectedRoute ở App.tsx
      localStorage.setItem('user', JSON.stringify({
        userId: payload.sub,
        username: payload.username,
        role: payload.role || 'USER' // Nếu back-end chưa trả về role, mặc định là USER
      }));

      // 5. Điều hướng thông minh dựa trên Role
      const userRole = payload.role;
      if (userRole === 'ADMIN') {
        navigate('/admin/users');
      } else if (userRole === 'MANAGER' || userRole === 'LEADER') {
        navigate('/manager/overview');
      } else {
        navigate('/student/overview');
      }

    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      // Hiển thị thông báo lỗi từ NestJS trả về hoặc lỗi hệ thống
      setError(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  const titleNode = (
    <div className="text-3xl font-black text-blue-600 tracking-tight">
      HVCS<span className="text-slate-800">.Edu</span>
    </div>
  );

  return (
    <AuthLayout
      title={titleNode}
      subtitle="Hệ thống Quản lý Thiết bị Phòng học"
      ssoText="Đăng nhập bằng Email Học viện"
      onSsoClick={() => window.location.href = 'http://localhost:3000/api/auth/google'}
      footerText="Chưa có tài khoản?"
      footerLinkText="Đăng ký ngay"
      footerLinkTo="/register"
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Hiển thị thông báo lỗi nếu đăng nhập thất bại */}
        {error && (
          <div className="flex items-center gap-3 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <InputGroup 
          label="Tên đăng nhập hoặc Email" 
          icon={<FiMail/>}
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập tên đăng nhập..."
          required
          disabled={loading}
        />
        <InputGroup 
          label="Mật khẩu" 
          icon={<FiLock />}
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          extraLabelAction={<a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">Quên mật khẩu?</a>}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  );
};