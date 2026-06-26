import { useState, useEffect } from 'react';
import { FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputGroup } from '../../components/ui/InputGroup';
import { API_BASE_URL } from '../../config/env';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectByRole = (role: string) => {
    if (role === 'ADMIN') {
      navigate('/admin/users');
    } else if (role === 'MANAGER' || role === 'LEADER') {
      navigate('/manager/overview');
    } else {
      navigate('/student/overview');
    }
  };

  // Giải mã JWT đúng UTF-8 để không lỗi tiếng Việt
  const decodeToken = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const binaryString = window.atob(base64);
    const bytes = Uint8Array.from(binaryString, (char) =>
      char.charCodeAt(0),
    );
    const jsonString = new TextDecoder('utf-8').decode(bytes);

    return JSON.parse(jsonString);
  };

  // Lấy thông tin user đầy đủ từ backend để có fullName thật
  const getFullUserByUsername = async (token: string, username: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user/getUserbyUsername/${encodeURIComponent(
          username,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (err) {
      console.error('Không lấy được thông tin user đầy đủ:', err);
      return null;
    }
  };

  // Lưu thông tin đăng nhập vào localStorage
  const saveUserToLocalStorage = async (
    accessToken: string,
    refreshToken: string,
    userFromApi?: any,
  ) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const payload = decodeToken(accessToken);

    const usernameValue =
      userFromApi?.username ||
      payload.username ||
      payload.userName ||
      '';

    const fullUser = usernameValue
      ? await getFullUserByUsername(accessToken, usernameValue)
      : null;

    const loggedUser = {
      userId:
        fullUser?.userId ||
        userFromApi?.userId ||
        payload.sub ||
        payload.userId,

      username:
        fullUser?.username ||
        userFromApi?.username ||
        payload.username ||
        usernameValue,

      fullName:
        fullUser?.fullName ||
        userFromApi?.fullName ||
        userFromApi?.hoTen ||
        userFromApi?.name ||
        userFromApi?.displayName ||
        payload.fullName ||
        usernameValue ||
        'Người dùng',

      email:
        fullUser?.email ||
        userFromApi?.email ||
        payload.email ||
        '',

      phoneNumber:
        fullUser?.phoneNumber ||
        userFromApi?.phoneNumber ||
        '',

      role:
        fullUser?.role ||
        userFromApi?.role ||
        payload.role ||
        'USER',

      roleId:
        fullUser?.roleId ||
        userFromApi?.roleId,

      status:
        fullUser?.status ||
        userFromApi?.status,
    };

    localStorage.setItem('user', JSON.stringify(loggedUser));
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));

    redirectByRole(loggedUser.role);
  };

  // Xử lý đăng nhập bằng Email Học viện / Google redirect
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError(decodeURIComponent(urlError));
      return;
    }

    if (accessToken && refreshToken) {
      saveUserToLocalStorage(accessToken, refreshToken).catch((err) => {
        console.error('Lỗi xử lý đăng nhập Email Học viện:', err);
        setError(
          'Có lỗi xảy ra khi xử lý thông tin đăng nhập từ Email Học viện',
        );
      });
    }
  }, [searchParams]);

  // Xử lý đăng nhập bằng tài khoản/mật khẩu
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        usernameOrEmail: username,
        password: password,
      });

      const { accessToken, refreshToken, user } = response.data;

      await saveUserToLocalStorage(accessToken, refreshToken, user);
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      setError(
        err.response?.data?.message ||
          'Tài khoản hoặc mật khẩu không chính xác!',
      );
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
      onSsoClick={() =>
        (window.location.href = `${API_BASE_URL}/auth/google`)
      }
      footerText="Tài khoản do Quản trị viên cấp. Nếu chưa có tài khoản, vui lòng liên hệ Admin."
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <InputGroup
          label="Tên đăng nhập hoặc Email"
          icon={<FiMail />}
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
          extraLabelAction={
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Quên mật khẩu?
            </Link>
          }
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