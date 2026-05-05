import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Gọi API đăng nhập tới NestJS backend
    console.log('Login with:', username, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-blue-600 tracking-tight mb-2">HVCS<span className="text-slate-800">.Edu</span></h1>
            <p className="text-sm text-slate-500">Hệ thống Quản lý Thiết bị Phòng học</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên đăng nhập hoặc Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Nhập tên đăng nhập..."
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Đăng nhập
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Hoặc</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="mt-6">
            <button 
              type="button" 
              className="w-full flex items-center justify-center py-2.5 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              <FiMail className="mr-2 text-rose-500 text-lg" />
              Đăng nhập bằng Email Học viện
            </button>
          </div>
        </div>
        
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Chưa có tài khoản? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};