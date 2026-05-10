import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';

// --- COMPONENT 1: AUTH LAYOUT (KHUNG GIAO DIỆN CHUNG) ---
interface AuthLayoutProps {
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  ssoText: string;
  onSsoClick: () => void;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export const AuthLayout = ({
  title, subtitle, children, ssoText, onSsoClick, footerText, footerLinkText, footerLinkTo
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          {/* Form Content */}
          {children}

          {/* Vách ngăn */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Hoặc</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Nút SSO */}
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
        
        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            {footerText} <Link to={footerLinkTo} className="font-semibold text-blue-600 hover:text-blue-700">{footerLinkText}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
