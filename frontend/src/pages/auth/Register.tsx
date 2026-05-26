import { Link } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const Register = () => {
  return (
    <AuthLayout
      title="Đăng ký đã bị vô hiệu hóa"
      subtitle="Tài khoản người dùng được Quản trị viên cấp trong hệ thống"
      ssoText="Quay về đăng nhập bằng Email Học viện"
      onSsoClick={() => window.location.href = '/login'}
      footerText="Đã có tài khoản được cấp?"
      footerLinkText="Đăng nhập"
      footerLinkTo="/login"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl">
          <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <p className="font-semibold">
              Không cho phép người dùng tự đăng ký tài khoản.
            </p>
            <p className="mt-1">
              Vui lòng liên hệ Quản trị viên để được cấp tài khoản và phân quyền phù hợp.
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="block w-full py-2.5 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Quay về đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
};