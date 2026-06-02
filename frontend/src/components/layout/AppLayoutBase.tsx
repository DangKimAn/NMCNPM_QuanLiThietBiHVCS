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
  FiX,
} from 'react-icons/fi';

import { UserProfileModal } from './UserProfileModal';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  type NotificationItem,
} from '../../services/notificationApi';
import { API_BASE_URL } from '../../config/env';

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

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'UNREAD'>(
    'ALL',
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const prevUnreadCountRef = useRef(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    userId: 0,
    username: 'user',
    fullName: 'Người dùng',
    email: '',
    role: 'USER',
  });

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const getRoleName = (user: any): string => {
    const role =
      user?.roleName ||
      user?.role ||
      user?.role?.roleName ||
      user?.role?.role_name ||
      'USER';

    return typeof role === 'string' ? role : 'USER';
  };

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
        role: getRoleName(user),
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

  const fetchUnreadNotificationCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      const newCount = data.unreadCount || 0;
      
      if (newCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
        setToastMessage('Bạn có thông báo phản ánh mới!');
        setTimeout(() => setToastMessage(null), 5000);
      }
      
      prevUnreadCountRef.current = newCount;
      setUnreadNotificationCount(newCount);
    } catch (error: any) {
      // Nếu token hết hạn hoặc không có quyền thì chỉ ẩn số thông báo,
      // không làm lỗi layout chính.
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setUnreadNotificationCount(0);
        return;
      }

      console.error('Không lấy được số thông báo chưa đọc:', error);
      setUnreadNotificationCount(0);
    }
  };

  const fetchNotificationList = async () => {
    try {
      const data = await getMyNotifications();

      setNotifications(data);
      setUnreadNotificationCount(data.filter((item) => !item.isRead).length);
    } catch (error) {
      console.error('Không lấy được danh sách thông báo:', error);
    }
  };

  const handleToggleNotification = async () => {
    const nextOpen = !isNotificationOpen;

    setIsNotificationOpen(nextOpen);
    setIsUserMenuOpen(false);

    if (nextOpen) {
      await fetchNotificationList();
    }
  };

  const handleClickNotificationItem = async (notificationItem: NotificationItem) => {
    try {
      await markNotificationAsRead(notificationItem.notificationId);
    } catch (error) {
      console.error('Không thể đánh dấu thông báo đã đọc:', error);
    }

    setIsNotificationOpen(false);
    await fetchUnreadNotificationCount();

    const match = notificationItem.content.match(/\[ID:(\d+)\]/);
    if (match) {
      const reportId = match[1];
      navigate(`/manager/incidents?report=${reportId}&highlight=${reportId}`);
    } else {
      navigate(`/notifications?notificationId=${notificationItem.notificationId}`);
    }
  };

  const formatNotificationDate = (value: string) => {
    return new Date(value).toLocaleDateString('vi-VN');
  };

  const displayedNotifications =
    notificationFilter === 'UNREAD'
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  const fetchFullUserInfo = async (username: string) => {
    const token =
      localStorage.getItem('accessToken') || localStorage.getItem('token');

    if (!token || !username || username === 'user') return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/user/getUserbyUsername/${encodeURIComponent(username)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Token hết hạn hoặc không có quyền thì bỏ qua,
      // không làm lỗi layout và không ảnh hưởng đăng nhập.
      if (response.status === 401 || response.status === 403) {
        return;
      }

      if (!response.ok) return;

      const fullUser = await response.json();

      const updatedUser: CurrentUser = {
        userId: fullUser.userId || currentUser.userId,
        username: fullUser.username || username,
        fullName: fullUser.fullName || fullUser.username || username,
        email: fullUser.email || '',
        role: getRoleName(fullUser),
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
    fetchFullUserInfo(localUser.username);
    
    // Initial fetch
    fetchUnreadNotificationCount();
    
    // Polling every 10 seconds for real-time notification
    const interval = setInterval(() => {
      fetchUnreadNotificationCount();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getAvatarText = (fullName: string) => {
    const safeName = fullName?.trim() || currentUser.username || 'U';
    const words = safeName.split(/\s+/);

    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }

    return safeName.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (keyword: string) => {
    const value = keyword.trim();

    if (!value) return;

    if (onSearch) {
      navigate(onSearch(value));
      return;
    }

    navigate(homePath);
  };

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
      <aside className="w-64 bg-white border-r border-slate-200 fixed left-0 top-0 bottom-0 z-30">
        <Link
          to={homePath}
          className="h-20 flex items-center px-8 border-b border-slate-100"
        >
          <h1 className="text-2xl font-black tracking-wide">
            <span className="text-blue-600">HVCS</span>
            <span className="text-slate-900">.edu</span>
          </h1>
        </Link>

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

      <div className="flex-1 ml-64 min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-8">
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
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={handleToggleNotification}
                className="relative text-slate-400 hover:text-slate-700 text-xl"
                title="Thông báo"
              >
                <FiBell />

                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                    {unreadNotificationCount > 99
                      ? '99+'
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-4 w-[630px] max-h-[620px] rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-blue-200 px-5 py-4">
                    <FiBell className="text-blue-500" />
                    <h3 className="text-base font-bold uppercase text-slate-800">
                      Thông báo
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setNotificationFilter('ALL')}
                      className={`rounded-full px-7 py-2 text-sm font-semibold transition ${
                        notificationFilter === 'ALL'
                          ? 'bg-blue-500 text-white'
                          : 'border border-blue-300 bg-white text-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      Tất cả
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationFilter('UNREAD')}
                      className={`rounded-full px-7 py-2 text-sm font-semibold transition ${
                        notificationFilter === 'UNREAD'
                          ? 'bg-blue-500 text-white'
                          : 'border border-blue-300 bg-white text-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      Chưa đọc
                    </button>
                  </div>

                  <div className="max-h-[460px] overflow-y-auto px-5 pb-4">
                    {displayedNotifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-500">
                        Không có thông báo nào
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {displayedNotifications.map((item) => (
                          <button
                            key={item.notificationId}
                            type="button"
                            onClick={() =>
                              handleClickNotificationItem(item)
                            }
                            className="group flex w-full items-start gap-4 py-4 text-left hover:bg-slate-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[15px] leading-6 text-slate-700 group-hover:text-blue-600"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                <span className="font-semibold">
                                  {item.sender?.fullName ||
                                    item.sender?.username ||
                                    'Hệ thống'}
                                </span>{' '}
                                thông báo: {item.title}
                              </p>

                              <p className="mt-2 text-sm italic text-slate-400">
                                {formatNotificationDate(item.createdAt)}
                              </p>
                            </div>

                            {!item.isRead && (
                              <span className="mt-7 h-3 w-3 rounded-full bg-blue-200" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate('/notifications');
                      }}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsNotificationOpen(false);
                }}
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

        <main className="p-8">{children}</main>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={currentUser.userId}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <FiBell className="text-xl animate-bounce" />
            <span className="font-semibold">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="ml-4 text-emerald-200 hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayoutBase;