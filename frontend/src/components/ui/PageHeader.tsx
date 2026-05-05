import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;          // Tiêu đề trang (Bắt buộc)
  description?: string;   // Dòng mô tả nhỏ ở dưới (Không bắt buộc)
  action?: ReactNode;     // Khu vực chứa nút bấm (Thêm mới, Filter...) bên phải (Không bắt buộc)
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      
      {/* Chỉ render khu vực nút bấm nếu có truyền prop action vào */}
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};