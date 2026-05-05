import { ReactNode } from 'react';
import { FiFilter } from 'react-icons/fi';

interface FilterSelectProps {
  value: string;                   // Giá trị đang được chọn
  onChange: (value: string) => void; // Hàm xử lý khi thay đổi
  options: string[];               // Danh sách các lựa chọn
  defaultLabel?: string;           // Dòng mặc định (VD: "Tất cả phòng học")
  optionPrefix?: string;           // Tiền tố cho các lựa chọn (VD: thêm chữ "Phòng " ra trước)
  icon?: ReactNode;                // Icon bên trái (mặc định là icon Filter)
}

export const FilterSelect = ({
  value,
  onChange,
  options,
  defaultLabel = "Tất cả",
  optionPrefix = "",
  icon = <FiFilter className="text-slate-400" />
}: FilterSelectProps) => {
  return (
    <div className="flex justify-end">
      <div className="relative w-full sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="All">{defaultLabel}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {optionPrefix}{opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};