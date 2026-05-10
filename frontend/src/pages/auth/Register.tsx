import { useState } from 'react';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';
// TODO: Sửa lại 2 đường dẫn import này cho khớp với thư mục dự án của bạn
import { AuthLayout } from '../../components/layout/AuthLayout'; 
import { InputGroup } from '../../components/ui/InputGroup';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    // TODO: Xử lý logic gọi API đăng ký tại đây
    console.log('Register with:', { fullName, email, username, password });
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
        <InputGroup 
          label="Họ và tên" 
          type="text" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="VD: Nguyễn Văn A"
          required
        />
        <InputGroup 
          label="Email học viện" 
          icon={<FiMail />}
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nva@hvcs.edu.vn"
          required
        />
        <InputGroup 
          label="Tên đăng nhập" 
          icon={<FiUser />}
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập tên đăng nhập"
          required
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
          />
          <InputGroup 
            label="Xác nhận" 
            icon={<FiLock />}
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button 
          type="submit" 
          className="w-full py-2.5 px-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Đăng ký tài khoản
        </button>
      </form>
    </AuthLayout>
  );
};