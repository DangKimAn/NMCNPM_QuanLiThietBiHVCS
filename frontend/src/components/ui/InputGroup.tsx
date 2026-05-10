import { ReactNode, InputHTMLAttributes } from 'react';

export interface InputGroupProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  extraLabelAction?: ReactNode; // Dùng cho các nút phụ như "Quên mật khẩu"
}

export const InputGroup = ({ 
  label, 
  icon, 
  extraLabelAction, 
  ...inputProps 
}: InputGroupProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        {extraLabelAction}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input 
          {...inputProps}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${inputProps.className || ''}`}
        />
      </div>
    </div>
  );
};