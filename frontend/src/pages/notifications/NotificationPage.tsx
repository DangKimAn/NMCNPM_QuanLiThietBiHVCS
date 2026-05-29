import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import AdminLayout from '../../components/layout/AdminLayout';
import ManagerLayout from '../../components/layout/ManagerLayout';
import StudentTeacherLayout from '../../components/layout/StudentTeacherLayout';

import {
  createNotification,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type CreateNotificationPayload,
  type NotificationItem,
  type NotificationTargetRole,
} from '../../services/notificationApi';

const targetRoleOptions: {
  value: NotificationTargetRole;
  label: string;
}[] = [
  { value: 'ALL', label: 'Tất cả người dùng' },
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'MANAGER', label: 'Cán bộ quản lý thiết bị' },
  { value: 'TEACHER', label: 'Giảng viên' },
  { value: 'STUDENT', label: 'Sinh viên' },
];

const getRoleLabel = (role: NotificationTargetRole) => {
  return targetRoleOptions.find((item) => item.value === role)?.label ?? role;
};

const getCurrentUserRole = (): string => {
  const possibleKeys = ['user', 'currentUser', 'authUser', 'account'];

  for (const key of possibleKeys) {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) continue;

    try {
      const parsed = JSON.parse(rawValue);

      const role =
        parsed?.roleName ||
        parsed?.role ||
        parsed?.role?.roleName ||
        parsed?.role?.role_name;

      if (role) {
        return String(role).toUpperCase();
      }
    } catch {
      // Bỏ qua nếu localStorage không phải JSON
    }
  }

  const rawRole = localStorage.getItem('role');

  return rawRole ? rawRole.toUpperCase() : '';
};

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const NotificationContent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedNotificationId = Number(searchParams.get('notificationId'));
  const hasSelectedNotificationId = selectedNotificationId > 0;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<CreateNotificationPayload>({
    title: '',
    content: '',
    targetRole: 'ALL',
  });

  const currentRole = getCurrentUserRole();
  const isManager = currentRole === 'MANAGER';

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  const selectedNotification = useMemo(() => {
    if (!hasSelectedNotificationId) return null;

    return (
      notifications.find(
        (item) => item.notificationId === selectedNotificationId,
      ) ?? null
    );
  }, [notifications, selectedNotificationId, hasSelectedNotificationId]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể tải danh sách thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!hasSelectedNotificationId) return;

    const readSelectedNotification = async () => {
      try {
        await markNotificationAsRead(selectedNotificationId);

        setNotifications((prev) =>
          prev.map((item) =>
            item.notificationId === selectedNotificationId
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item,
          ),
        );
      } catch (error) {
        console.error(error);
      }
    };

    readSelectedNotification();
  }, [selectedNotificationId, hasSelectedNotificationId]);

  const handleChangeForm = (
    field: keyof CreateNotificationPayload,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateNotification = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề thông báo');
      return;
    }

    if (!formData.content.trim()) {
      setErrorMessage('Vui lòng nhập nội dung thông báo');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      await createNotification({
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetRole: formData.targetRole,
      });

      setFormData({
        title: '',
        content: '',
        targetRole: 'ALL',
      });

      setShowCreateForm(false);
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể tạo thông báo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notificationId
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể đánh dấu đã đọc');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa thông báo này không?');

    if (!confirmed) return;

    try {
      await deleteNotification(notificationId);

      setNotifications((prev) =>
        prev.filter((item) => item.notificationId !== notificationId),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể xóa thông báo');
    }
  };

  const handleNavigateToReport = async (item: NotificationItem) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.notificationId);
    }
    
    const match = item.content.match(/\[ID:(\d+)\]/);
    if (match) {
      const reportId = match[1];
      navigate(`/manager/incidents?report=${reportId}&highlight=${reportId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiBell size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Thông báo
              </h1>
              <p className="text-sm text-slate-500">
                Xem các thông báo mới nhất từ hệ thống
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchNotifications}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw />
              Làm mới
            </button>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheckCircle />
              Đánh dấu tất cả đã đọc
            </button>

            {isManager && (
              <button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {showCreateForm ? <FiX /> : <FiPlus />}
                {showCreateForm ? 'Đóng' : 'Viết thông báo'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Tổng thông báo</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Chưa đọc</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Vai trò hiện tại</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {currentRole || 'Không xác định'}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {selectedNotification && (
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Chi tiết thông báo
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {getRoleLabel(selectedNotification.targetRole)}
            </span>

            <span className="text-xs text-slate-400">
              {formatDateTime(selectedNotification.createdAt)}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">
            {selectedNotification.title}
          </h2>

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
            {selectedNotification.content.replace(/\[ID:\d+\]\s*/g, '')}
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Người gửi:{' '}
            <span className="font-semibold text-slate-800">
              {selectedNotification.sender.fullName ||
                selectedNotification.sender.username ||
                selectedNotification.sender.email}
            </span>
          </div>
        </div>
      )}

      {hasSelectedNotificationId && !selectedNotification && !isLoading && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Không tìm thấy thông báo cần xem chi tiết.
        </div>
      )}

      {isManager && showCreateForm && (
        <form
          onSubmit={handleCreateNotification}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Viết thông báo mới
          </h2>

          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tiêu đề
              </label>
              <input
                value={formData.title}
                onChange={(event) =>
                  handleChangeForm('title', event.target.value)
                }
                placeholder="Nhập tiêu đề thông báo"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Gửi đến
              </label>
              <select
                value={formData.targetRole}
                onChange={(event) =>
                  handleChangeForm(
                    'targetRole',
                    event.target.value as NotificationTargetRole,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {targetRoleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nội dung
              </label>
              <textarea
                value={formData.content}
                onChange={(event) =>
                  handleChangeForm('content', event.target.value)
                }
                rows={5}
                placeholder="Nhập nội dung thông báo"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <FiBell size={26} />
            </div>

            <p className="mt-3 font-medium text-slate-700">
              Chưa có thông báo nào
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Khi có thông báo mới, nội dung sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.notificationId}
                className={`p-5 ${
                  item.isRead ? 'bg-white' : 'bg-blue-50/50'
                } ${
                  item.notificationId === selectedNotificationId
                    ? 'ring-2 ring-blue-200'
                    : ''
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div 
                    className="min-w-0 flex-1 cursor-pointer hover:bg-slate-50/50 p-2 -m-2 rounded-xl transition-colors"
                    onClick={() => handleNavigateToReport(item)}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {!item.isRead && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                          Mới
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {getRoleLabel(item.targetRole)}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800">
                      {item.title}
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {item.content.replace(/\[ID:\d+\]\s*/g, '')}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      Người gửi:{' '}
                      {item.sender.fullName ||
                        item.sender.username ||
                        item.sender.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.notificationId)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                      >
                        <FiCheck />
                        Đã đọc
                      </button>
                    )}

                    {isManager && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteNotification(item.notificationId)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationPage = () => {
  const currentRole = getCurrentUserRole();

  if (currentRole === 'ADMIN') {
    return (
      <AdminLayout>
        <NotificationContent />
      </AdminLayout>
    );
  }

  if (currentRole === 'MANAGER') {
    return (
      <ManagerLayout>
        <NotificationContent />
      </ManagerLayout>
    );
  }

  return (
    <StudentTeacherLayout>
      <NotificationContent />
    </StudentTeacherLayout>
  );
};

export default NotificationPage;