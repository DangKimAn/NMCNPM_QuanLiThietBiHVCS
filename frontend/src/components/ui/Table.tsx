import { ReactNode } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

// ĐỊNH NGHĨA CẤU TRÚC 1 CỘT TRONG BẢNG
export interface TableColumn {
  header: string;                  
  key: string;                     
  render?: (item: any) => ReactNode; 
}

interface TableProps {
  data: any[];                     
  columns: TableColumn[];          
  idKey?: string;                  
  onEdit?: (item: any) => void;    
  onDelete?: (id: string) => void; 
  emptyMessage?: string;           
  // THÊM KHE CẮM CHO CÁC NÚT TÙY CHỈNH (VD: Nút Khóa, Nút Reset Pass...)
  extraRowActions?: (item: any) => ReactNode;
}

export const Table = ({ 
  data, 
  columns, 
  idKey = 'id', 
  onEdit, 
  onDelete,
  emptyMessage = "Không tìm thấy dữ liệu.",
  extraRowActions
}: TableProps) => {
  
  const hasActions = !!onEdit || !!onDelete;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>

          {/* VẼ BODY BẢNG */}
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                  
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-slate-700">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}

                  {/* VẼ CỘT THAO TÁC */}
                  {hasActions && (
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end space-x-3">

                        {/* RENDER NÚT TÙY CHỈNH Ở ĐÂY */}
                        {extraRowActions && extraRowActions(item)}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(item)} 
                            className="text-slate-400 hover:text-blue-600 transition" 
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 className="text-lg" />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(item[idKey])} 
                            className="text-slate-400 hover:text-rose-600 transition" 
                            title="Xóa"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-6 py-12 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* VẼ FOOTER */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
        <span className="text-sm text-slate-500">Hiển thị {data.length} dòng dữ liệu</span>
      </div>
    </div>
  );
};