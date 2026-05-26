import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCreditCard,
  FiLock,
  FiLogOut,
  FiSearch,
  FiUser,
  FiUserCheck,
} from 'react-icons/fi';
import { UserProfileModal } from './UserProfileModal';

export interface LayoutMenuItem {
  label: string;
  icon: ReactNode;
  path: string;
}

interface AppLayoutBaseProps {
  children: ReactNode;
  menuTitle: string;
  menuItems: LayoutMenuItem[];
  homePath: string;
  searchPlaceholder?: string;
  onSearch?: (keyword: string) => string;
}

interface CurrentUser {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

const API_BASE_URL = 'http://localhost:3000/api';

// Layout nền dùng chung cho Admin, Cán bộ quản lý, Sinh viên/Giảng viên
export const AppLayoutBase = ({
  children,
  menuTitle,
  menuItems,
  homePath,
  searchPlaceholder = 'Tìm kiếm...',
  onSearch,
}: AppLayoutBaseProps) => {
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    userId: 0,
    username: 'user',
    fullName: 'Người dùng',
    email: '',
    role: 'USER',
  });

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Lấy user từ localStorage
  const getUserFromLocalStorage = (): CurrentUser => {
    const rawUser =
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user') ||
      localStorage.getItem('authUser');

    if (!rawUser) {
      return {
        userId: 0,
        username: 'user',
        fullName: 'Người dùng',
        email: '',
        role: 'USER',
      };
    }

    try {
      const user = JSON.parse(rawUser);

      const username =
        user.username ||
        user.userName ||
        user.taiKhoan ||
        user.tenDangNhap ||
        user.email ||
        'user';

      const fullName =
        user.fullName ||
        user.hoTen ||
        user.hoten ||
        user.name ||
        user.displayName ||
        username;

      return {
        userId: user.userId || user.id || user.sub || 0,
        username,
        fullName,
        email: user.email || '',
        role: user.role || user.roleName || 'USER',
      };
    } catch {
      return {
        userId: 0,
        username: 'user',
        fullName: 'Người dùng',
        email: '',
        role: 'USER',
      };
    }
  };

  // Lấy lại thông tin user đầy đủ từ backend để đảm bảo fullName đúng
  const fetchFullUserInfo = async (username: string) => {
    const token = localStorage.getItem('accessToken');

    if (!token || !username || username === 'user') return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/user/getUserbyUsername/${encodeURIComponent(
          username,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const fullUser = await response.json();

      const updatedUser: CurrentUser = {
        userId: fullUser.userId || currentUser.userId,
        username: fullUser.username || username,
        fullName: fullUser.fullName || fullUser.username || username,
        email: fullUser.email || '',
        role: fullUser.role || 'USER',
      };

      setCurrentUser(updatedUser);

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Không lấy được thông tin user đầy đủ:', error);
    }
  };

  useEffect(() => {
    const localUser = getUserFromLocalStorage();
    setCurrentUser(localUser);

    // Nếu đăng nhập bằng Email Học viện, lấy lại fullName thật từ backend
    fetchFullUserInfo(localUser.username);
  }, []);

  // Lấy chữ viết tắt cho avatar
  const getAvatarText = (fullName: string) => {
    const safeName = fullName?.trim() || currentUser.username || 'U';
    const words = safeName.split(/\s+/);

    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }

    return safeName.slice(0, 2).toUpperCase();
  };

  // Click ra ngoài dropdown thì tự đóng
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Xử lý tìm kiếm trên thanh header
  const handleSearch = (keyword: string) => {
    const value = keyword.trim();

    if (!value) return;

    if (onSearch) {
      navigate(onSearch(value));
      return;
    }

    navigate(homePath);
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <Link
          to={homePath}
          className="h-20 flex items-center px-8 border-b border-slate-100"
        >
          <h1 className="text-2xl font-black tracking-wide">
            <span className="text-blue-600">HVCS</span>
            <span className="text-slate-900">.edu</span>
          </h1>
        </Link>

        {/* Menu */}
        <nav className="px-4 py-6">
          <p className="px-3 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            {menuTitle}
          </p>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      {/* Nội dung bên phải */}
      <div className="flex-1 ml-64 min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-8">
          {/* Tìm kiếm */}
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder={searchPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e.currentTarget.value);
                }
              }}
              className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-5">
            {/* Chuông thông báo */}
            <button
              type="button"
              onClick={() => navigate(homePath)}
              className="text-slate-400 hover:text-slate-700 text-xl"
              title="Thông báo"
            >
              <FiBell />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            {/* Avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-1 transition"
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">
                    {currentUser.fullName}
                  </p>

                  <p className="text-xs text-blue-600 font-semibold">
                    {currentUser.username}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                  {getAvatarText(currentUser.fullName)}
                </div>

                <span
                  className={`text-slate-400 transition ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 text-slate-700">
                      <FiUserCheck className="text-xl text-slate-500" />

                      <p className="text-sm">
                        Họ tên:{' '}
                        <span className="font-bold">
                          {currentUser.fullName}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-slate-700">
                      <FiCreditCard className="text-xl text-slate-500" />

                      <p className="text-sm">
                        Tài khoản:{' '}
                        <span className="font-bold">
                          {currentUser.username}
                        </span>
                      </p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 text-left text-slate-600 hover:text-blue-600 transition"
                    >
                      <FiUser className="text-xl" />
                      <span className="text-sm font-medium">
                        Thông tin cá nhân
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 text-left text-slate-600 hover:text-blue-600 transition"
                    >
                      <FiLock className="text-xl" />
                      <span className="text-sm font-medium">Đổi mật khẩu</span>
                    </button>

                    <div className="h-px bg-slate-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 text-left text-red-600 hover:text-red-700 transition"
                    >
                      <FiLogOut className="text-xl" />
                      <span className="text-sm font-bold">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Nội dung từng trang */}
        <main className="p-8">{children}</main>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={currentUser.userId}
      />
    </div>
  );
};

export default AppLayoutBase;