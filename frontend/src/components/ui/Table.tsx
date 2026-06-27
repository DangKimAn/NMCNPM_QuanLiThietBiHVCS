import { ReactNode, useState } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiX } from 'react-icons/fi';

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
  // CẤU HÌNH CHO MOBILE CARD
  mobilePrimaryColumnKey?: string;
  mobileSecondaryColumnKey?: string;
}

export const Table = ({ 
  data, 
  columns, 
  idKey = 'id', 
  onEdit, 
  onDelete,
  emptyMessage = "Không tìm thấy dữ liệu.",
  extraRowActions,
  mobilePrimaryColumnKey,
  mobileSecondaryColumnKey
}: TableProps) => {
  
  const hasActions = !!onEdit || !!onDelete;
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const primaryCol = mobilePrimaryColumnKey ? columns.find(c => c.key === mobilePrimaryColumnKey) || columns[0] : columns[0];
  const secondaryCol = mobileSecondaryColumnKey ? columns.find(c => c.key === mobileSecondaryColumnKey) || columns[1] : columns[1];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      
      {/* ── GIAO DIỆN DESKTOP: BẢNG TRUYỀN THỐNG ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right whitespace-nowrap">
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
                    <td key={colIndex} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
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
      
      {/* ── GIAO DIỆN MOBILE: DANH SÁCH THẺ (CARDS) ── */}
      <div className="md:hidden divide-y divide-slate-100">
        {data.length > 0 ? (
          data.map((item, rowIndex) => (
            <div key={`mobile-${rowIndex}`} className="p-4 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2 gap-3">
                <div className="flex-1 min-w-0">
                  {/* Dòng 1: Tiêu đề chính */}
                  <div className="font-bold text-slate-800 text-sm truncate">
                    {primaryCol ? (primaryCol.render ? primaryCol.render(item) : item[primaryCol.key]) : 'Không có dữ liệu'}
                  </div>
                  {/* Dòng 2: Thông tin phụ */}
                  <div className="text-sm text-slate-500 truncate mt-0.5">
                    {secondaryCol ? (secondaryCol.render ? secondaryCol.render(item) : item[secondaryCol.key]) : ''}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedItem(item)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg shrink-0 flex items-center shadow-sm"
                >
                  <FiEye className="mr-1.5" /> Chi tiết
                </button>
              </div>
              
              {/* Cụm nút thao tác trên Card */}
              {hasActions && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-5">
                  {extraRowActions && extraRowActions(item)}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)} 
                      className="text-slate-500 hover:text-blue-600 flex items-center text-xs font-medium"
                    >
                      <FiEdit2 className="mr-1.5" /> Sửa
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item[idKey])} 
                      className="text-slate-500 hover:text-rose-600 flex items-center text-xs font-medium"
                    >
                      <FiTrash2 className="mr-1.5" /> Xóa
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* VẼ FOOTER DÙNG CHUNG */}
      <div className="px-4 md:px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
        <span className="text-sm text-slate-500">Hiển thị {data.length} dòng dữ liệu</span>
      </div>

      {/* MODAL XEM CHI TIẾT DÀNH CHO MOBILE */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Thông tin chi tiết</h3>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {columns.map((col, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{col.header}</p>
                  <div className="text-sm text-slate-800 break-words">
                    {col.render ? col.render(selectedItem) : selectedItem[col.key]}
                  </div>
                </div>
              ))}
            </div>

            {hasActions && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                {extraRowActions && extraRowActions(selectedItem)}
                {onEdit && (
                  <button 
                    onClick={() => { setSelectedItem(null); onEdit(selectedItem); }} 
                    className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition"
                  >
                    Chỉnh sửa
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => { setSelectedItem(null); onDelete(selectedItem[idKey]); }} 
                    className="px-4 py-2 bg-rose-100 text-rose-700 text-sm font-semibold rounded-lg hover:bg-rose-200 transition"
                  >
                    Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};