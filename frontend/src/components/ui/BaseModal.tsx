import { ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

interface BaseModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;        
  submitText?: string;        
  submitIcon?: ReactNode;     
  extraActions?: ReactNode;  
}

export const BaseModal = ({ 
  isOpen, 
  title, 
  onClose, 
  onSubmit, 
  children, 
  submitText = 'Lưu thay đổi',
  submitIcon,
  extraActions
}: BaseModalProps) => {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <FiX className="text-xl" />
          </button>
        </div>
        
        {/* Form Body & Footer */}
        <form onSubmit={onSubmit} className="p-6">
          
          {/* NỘI DUNG ĐỘNG (children) */}
          <div className="space-y-4">
            {children}
          </div>

          {/* Footer */}
          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            {/* Góc trái: Các nút phụ trợ (nếu có) */}
            <div>
              {extraActions}
            </div>

            {/* Góc phải: Cụm Lưu/Hủy mặc định */}
            <div className="flex space-x-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                {submitIcon && <span className="mr-2">{submitIcon}</span>}
                {submitText}
              </button>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
};