import { useState } from 'react';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom'; // 👈 Thêm hook để chuyển hướng trang
import axios from 'axios'; // 👈 Thêm axios để đẩy API
import { AuthLayout } from '../../components/layout/AuthLayout'; 
import { InputGroup } from '../../components/ui/InputGroup';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Các state hỗ trợ thông báo trạng thái
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Kiểm tra nhanh mật khẩu nhập lại
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setLoading(true);

    try {
      // 1. Gửi request POST sang cổng NestJS (nhớ check lại port 3000 hoặc port thực tế của bạn)
      await axios.post('http://localhost:3000/auth/register', {
        fullName,
        email,
        username,
        password
      });

      // 2. Báo thành công lên giao diện
      setSuccess('Đăng ký tài khoản học viện thành công! Đang chuyển hướng...');

      // 3. Delay 2 giây rồi đưa user sang màn hình đăng nhập
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Lỗi đăng ký hệ thống:', err);
      // Lấy câu thông báo chi tiết từ NestJS (nếu có), không thì hiển thị câu mặc định
      setError(err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập hoặc Email đã tồn tại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Tham gia hệ thống quản lý thiết bị HVCS"
      ssoText="Đăng ký nhanh bằng Email Học viện"
      onSsoClick={() => console.log('Chuyển hướng SSO Register...')}
      footerText="Đã có tài khoản?"
      footerLinkText="Đăng nhập"
      footerLinkTo="/login"
    >
      <form onSubmit={handleRegister} className="space-y-4">
        
        {/* Khối hiển thị thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Khối hiển thị thông báo thành công */}
        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
            {success}
          </div>
        )}

        <InputGroup 
          label="Họ và tên" 
          type="text" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="VD: Nguyễn Văn A"
          required
          disabled={loading}
        />
        <InputGroup 
          label="Email học viện" 
          icon={<FiMail />}
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nva@hvcs.edu.vn"
          required
          disabled={loading}
        />
        <InputGroup 
          label="Tên đăng nhập" 
          icon={<FiUser />}
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập tên đăng nhập"
          required
          disabled={loading}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup 
            label="Mật khẩu" 
            icon={<FiLock />}
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <InputGroup 
            label="Xác nhận" 
            icon={<FiLock />}
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2.5 px-4 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
        </button>
      </form>
    </AuthLayout>
  );
};