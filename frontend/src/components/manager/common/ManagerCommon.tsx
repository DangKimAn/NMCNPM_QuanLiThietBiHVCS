// File chứa các component và hàm dùng chung cho phần Cán bộ quản lý thiết bị.
// Việc tách ra file này giúp tránh viết lặp lại code ở nhiều nơi.

import type { FormEvent, ReactNode } from 'react';
import { FiSave, FiX } from 'react-icons/fi';

import type { DeviceStatus, ReportStatus } from '../../../types/manager';

// Lấy ngày hiện tại theo định dạng yyyy-mm-dd, dùng cho input type="date"
export const getToday = () => new Date().toISOString().slice(0, 10);

// Lấy thời gian hiện tại, dùng khi cập nhật xử lý phản ánh
export const getNow = () => {
  const now = new Date();
  return now.toISOString().slice(0, 16).replace('T', ' ');
};

// Trả về class Tailwind tương ứng với từng trạng thái thiết bị
export const getDeviceStatusStyle = (status: DeviceStatus) => {
  switch (status) {
    case 'Hoạt động':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Báo hỏng':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'Đang sửa':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Bảo trì':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Thanh lý':
      return 'bg-slate-200 text-slate-600 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

// Trả về class Tailwind tương ứng với từng trạng thái phản ánh
export const getReportStatusStyle = (status: ReportStatus) => {
  switch (status) {
    case 'Mới tiếp nhận':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'Đang xử lý':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Đã xử lý':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Từ chối':
      return 'bg-slate-200 text-slate-600 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

// Card thống kê dùng ở đầu trang
export const SummaryCard = ({ icon, label, value }: SummaryCardProps) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
      {icon}
    </div>

    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

// Nút tab dùng để chuyển giữa các khu vực chức năng
export const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`pb-3 flex items-center gap-2 text-sm font-semibold border-b-2 transition ${
      active
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

interface TableHeadProps {
  children: ReactNode;
  alignRight?: boolean;
}

// Component tiêu đề cột trong bảng
export const TableHead = ({ children, alignRight = false }: TableHeadProps) => (
  <th
    className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase ${
      alignRight ? 'text-right' : ''
    }`}
  >
    {children}
  </th>
);

interface StatusBadgeProps {
  status: DeviceStatus | ReportStatus;
  type: 'device' | 'report';
}

// Badge hiển thị trạng thái thiết bị hoặc trạng thái phản ánh
export const StatusBadge = ({ status, type }: StatusBadgeProps) => {
  const className =
    type === 'device'
      ? getDeviceStatusStyle(status as DeviceStatus)
      : getReportStatusStyle(status as ReportStatus);

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
      {status}
    </span>
  );
};

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  label: string;
}

// Select lọc dữ liệu, ví dụ lọc theo phòng, loại hoặc trạng thái
export const FilterSelect = ({ value, onChange, options, label }: FilterSelectProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
  >
    <option value="All">{label}</option>

    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitText: string;
}

// Modal dùng chung cho form thêm, sửa, cập nhật và xử lý
export const Modal = ({ title, children, onClose, onSubmit, submitText }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        <div className="space-y-4">{children}</div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <FiSave className="mr-2" />
            {submitText}
          </button>
        </div>
      </form>
    </div>
  </div>
);

interface FieldInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}

// Input dùng chung cho các form
export const FieldInput = ({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  required = true,
}: FieldInputProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>

    <input
      type={type}
      value={value}
      disabled={disabled}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${
        disabled
          ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
          : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
      }`}
    />
  </div>
);

interface FieldSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

// Select dùng chung trong form
export const FieldSelect = ({ label, value, options, onChange }: FieldSelectProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>

    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      required
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

interface FieldTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Textarea dùng chung để nhập ghi chú
export const FieldTextArea = ({
  label,
  value,
  onChange,
  placeholder = 'Nhập ghi chú...',
}: FieldTextAreaProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>

    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      placeholder={placeholder}
    />
  </div>
);