import { useState } from 'react';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputGroup } from '../../components/ui/InputGroup';
export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login with:', username, password);
  };

  const customUserImg = ''
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
      onSsoClick={() => console.log('Chuyển hướng SSO Login...')}
      footerText="Chưa có tài khoản?"
      footerLinkText="Đăng ký ngay"
      footerLinkTo="/register"
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <InputGroup 
          label="Tên đăng nhập hoặc Email" 
          icon={<FiMail/>}
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập tên đăng nhập..."
          required
        />
        <InputGroup 
          label="Mật khẩu" 
          icon={<FiLock />}
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          extraLabelAction={<a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">Quên mật khẩu?</a>}
        />
        <button type="submit" className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
          Đăng nhập
        </button>
      </form>
    </AuthLayout>
  );
};
