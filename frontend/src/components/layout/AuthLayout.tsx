import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';

// Component AuthLayout là khung giao diện dùng chung cho trang đăng nhập và đăng ký
interface AuthLayoutProps {
  children: ReactNode;
  title: string | ReactNode;
  subtitle: string;
  ssoText: string;
  onSsoClick: () => void;
  footerText: string;
  footerLinkText?: string;
  footerLinkTo?: string;
}

export const AuthLayout = ({
  title,
  subtitle,
  children,
  ssoText,
  onSsoClick,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          {/* Phần tiêu đề của form */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">
              {title}
            </h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          {/* Nội dung form đăng nhập hoặc đăng ký */}
          {children}

          {/* Đường phân cách giữa form và nút SSO */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Hoặc
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Nút đăng nhập bằng Email Học viện */}
          <div className="mt-6">
            <button
              type="button"
              onClick={onSsoClick}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              <FiMail className="mr-2 text-rose-500 text-lg" />
              {ssoText}
            </button>
          </div>
        </div>

        {/* Footer bên dưới form */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            {footerText}

            {footerLinkText && footerLinkTo && (
              <>
                {' '}
                <Link
                  to={footerLinkTo}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  {footerLinkText}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};