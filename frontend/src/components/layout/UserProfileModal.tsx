import { useState, useEffect } from 'react';
import { FiX, FiUser, FiLock, FiCheckCircle } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:3000/api';

async function authRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = 'Có lỗi xảy ra';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

interface UserProfileData {
  userId: number;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export const UserProfileModal = ({ isOpen, onClose, userId }: UserProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
      setMessage(null);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('profile');
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await authRequest<UserProfileData>(`/user/getUserbyUserId/${userId}`);
      setProfileData(data);
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Không thể tải thông tin người dùng.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.oldPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu cũ.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await authRequest(`/user/${userId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword 
        }),
      });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Đổi mật khẩu thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Cài đặt tài khoản</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
          >
            <FiX />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser />
            Thông tin cá nhân
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'password' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('password')}
          >
            <FiLock />
            Đổi mật khẩu
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {message.type === 'success' && <FiCheckCircle className="text-xl" />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              {loading && !profileData ? (
                <div className="text-center py-8 text-slate-500">Đang tải thông tin...</div>
              ) : profileData ? (
                <div className="space-y-4">
                  {(profileData.role === 'STUDENT' || profileData.role === 'TEACHER') ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và tên</label>
                      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                        {profileData.username}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tài khoản</label>
                      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                        {profileData.username}
                      </div>
                    </div>
                  )}

                  {profileData.role === 'STUDENT' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mã sinh viên</label>
                      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                        {profileData.email.split('@')[0].toLowerCase()}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                      {profileData.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vai trò</label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {profileData.role}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày tạo tài khoản</label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                      {new Date(profileData.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu cũ</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nhập mật khẩu cũ..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nhập mật khẩu mới..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
