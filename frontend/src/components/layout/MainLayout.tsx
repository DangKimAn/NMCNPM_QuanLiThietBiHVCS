import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiBox,
  FiCreditCard,
  FiHome,
  FiLock,
  FiLogOut,
  FiSearch,
  FiTool,
  FiUser,
  FiUserCheck,
} from 'react-icons/fi';

interface MainLayoutProps {
  children: ReactNode;
}

// Menu chính dành riêng cho Cán bộ quản lý thiết bị
const menuItems = [
  {
    label: 'Tổng quan',
    icon: <FiHome />,
    path: '/manager/overview',
  },
  {
    label: 'Quản lý thiết bị',
    icon: <FiBox />,
    path: '/manager/devices',
  },
  {
    label: 'Phản ánh sự cố',
    icon: <FiTool />,
    path: '/manager/incidents',
  },
];

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();

  // State đóng/mở dropdown avatar
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Ref dùng để phát hiện click ra ngoài dropdown
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Lấy thông tin tài khoản đang đăng nhập từ localStorage.
  // Login.tsx chỉ cần lưu currentUser thì chỗ này sẽ tự hiển thị đúng.
  const currentUser = useMemo(() => {
    const rawUser =
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user') ||
      localStorage.getItem('authUser');

    if (!rawUser) {
      return {
        userId: 1,
        fullName: 'Cán bộ QLTB',
        username: 'manager',
        role: 'Cán bộ quản lý thiết bị',
      };
    }

    try {
      const user = JSON.parse(rawUser);

      return {
        userId: user.userId || user.id || 1,

        // Họ tên hiển thị trên header và dropdown
        fullName:
          user.fullName ||
          user.name ||
          user.hoTen ||
          user.hoten ||
          user.displayName ||
          'Cán bộ QLTB',

        // Tên đăng nhập hiển thị trên header và dropdown
        username:
          user.username ||
          user.userName ||
          user.taiKhoan ||
          user.tenDangNhap ||
          user.email ||
          'manager',

        role: user.role || user.roleName || 'Cán bộ quản lý thiết bị',
      };
    } catch {
      return {
        userId: 1,
        fullName: 'Cán bộ QLTB',
        username: 'manager',
        role: 'Cán bộ quản lý thiết bị',
      };
    }
  }, []);

  // Lấy chữ cái đầu để hiển thị avatar
  // Ví dụ: Nguyễn Trọng Nguyên -> NN
  const getAvatarText = (fullName: string) => {
    const words = fullName.trim().split(/\s+/);

    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }

    return fullName.slice(0, 2).toUpperCase();
  };

  // Click ra ngoài dropdown thì tự đóng menu
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

  // Tìm kiếm nhanh thiết bị trên thanh header
  const handleSearch = (keyword: string) => {
    const value = keyword.trim();

    if (!value) return;

    navigate(`/manager/devices?keyword=${encodeURIComponent(value)}`);
  };

  // Đăng xuất: xóa thông tin đăng nhập rồi quay về trang login
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');

    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar bên trái */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed left-0 top-0 bottom-0 z-30">
        {/* Logo bấm về trang tổng quan */}
        <Link
          to="/manager/overview"
          className="h-20 flex items-center px-8 border-b border-slate-100"
        >
          <h1 className="text-2xl font-black tracking-wide">
            <span className="text-blue-600">HVCS</span>
            <span className="text-slate-900">.edu</span>
          </h1>
        </Link>

        <nav className="px-4 py-6">
          <div>
            <p className="px-3 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Menu cán bộ quản lý
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
          </div>
        </nav>
      </aside>

      {/* Phần nội dung bên phải */}
      <div className="flex-1 ml-64 min-w-0">
        {/* Header trên cùng */}
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-8">
          {/* Ô tìm kiếm trên header */}
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Tìm kiếm thiết bị, phòng học..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e.currentTarget.value);
                }
              }}
              className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-5">
            {/* Bấm chuông chuyển sang trang phản ánh sự cố */}
            <button
              type="button"
              onClick={() => navigate('/manager/incidents')}
              className="text-slate-400 hover:text-slate-700 text-xl"
              title="Xem phản ánh sự cố"
            >
              <FiBell />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            {/* Avatar và dropdown tài khoản */}
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

                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md overflow-hidden">
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

              {/* Dropdown khi bấm avatar */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-5 space-y-4">
                    {/* Họ tên */}
                    <div className="flex items-center gap-3 text-slate-700">
                      <FiUserCheck className="text-xl text-slate-500" />

                      <p className="text-sm">
                        Họ tên:{' '}
                        <span className="font-bold">
                          {currentUser.fullName}
                        </span>
                      </p>
                    </div>

                    {/* Tài khoản */}
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

                    {/* Thông tin cá nhân */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        alert('Chức năng thông tin cá nhân đang được phát triển.');
                      }}
                      className="w-full flex items-center gap-3 text-left text-slate-600 hover:text-blue-600 transition"
                    >
                      <FiUser className="text-xl" />
                      <span className="text-sm font-medium">
                        Thông tin cá nhân
                      </span>
                    </button>

                    {/* Đổi mật khẩu */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        alert('Chức năng đổi mật khẩu đang được phát triển.');
                      }}
                      className="w-full flex items-center gap-3 text-left text-slate-600 hover:text-blue-600 transition"
                    >
                      <FiLock className="text-xl" />
                      <span className="text-sm font-medium">Đổi mật khẩu</span>
                    </button>

                    <div className="h-px bg-slate-100" />

                    {/* Đăng xuất */}
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
    </div>
  );
};

export default MainLayout;