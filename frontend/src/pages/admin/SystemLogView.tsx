import { useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiClock, FiCheckSquare, FiSquare } from 'react-icons/fi';

// 1. DỮ LIỆU KHỞI TẠO (Dummy Data)
const initialLogs = [
  { id: 'LOG001', timestamp: '10/05/2026 08:00:12', user: 'admin_hethong', action: 'Đăng nhập hệ thống thành công' },
  { id: 'LOG002', timestamp: '10/05/2026 09:15:05', user: 'cb_thietbi1', action: 'Cập nhật trạng thái máy chiếu phòng A102' },
  { id: 'LOG003', timestamp: '10/05/2026 10:30:22', user: 'admin_hethong', action: 'Thêm mới tài khoản GV002' },
  { id: 'LOG004', timestamp: '10/05/2026 11:45:10', user: 'gv_toancc', action: 'Gửi yêu cầu mượn thiết bị âm thanh' },
  { id: 'LOG005', timestamp: '10/05/2026 14:20:00', user: 'admin_hethong', action: 'Khóa tài khoản sinh viên SV001' },
];

export const SystemLogViewer = () => {
  const [specialLogs, setSpecialLogs] = useState<Set<string>>(new Set());

  const toggleSpecialLog = (logId: string) => {
    setSpecialLogs((prev) => {
      const newSpecialLogs = new Set(prev);
      if (newSpecialLogs.has(logId)) {
        newSpecialLogs.delete(logId);
      } else {
        newSpecialLogs.add(logId);
      }
      return newSpecialLogs;
    });
  };

  return (
    <MainLayout>
      <PageHeader
        title="Nhật ký hệ thống (System Logs)"
        description="Xem và theo dõi các hoạt động, thao tác của người dùng trong hệ thống."
      />

      {/* DANH SÁCH LOGS */}
      <div className="mt-6 space-y-3">
        {initialLogs.map((log) => {
          const isSpecial = specialLogs.has(log.id);

          return (
            <div
              key={log.id}
              // TOÀN BỘ DÒNG ĐỔI MÀU Ở ĐÂY
              className={`flex items-center justify-between p-4 rounded-lg border shadow-sm transition-all duration-300 ${
                isSpecial
                  ? 'bg-red-600 text-white border-red-700' 
                  : 'bg-sky-50 text-slate-900 border-sky-100' 
              }`}
              onClick={() => toggleSpecialLog(log.id)}
                title={isSpecial ? "Bỏ đánh dấu" : "Đánh dấu"}
            >
              <div className="flex flex-col gap-1">
                {/* Khu vực thời gian và user cũng tự động đổi màu cho phù hợp với nền */}
                <div className={`flex items-center gap-2 text-sm font-medium ${isSpecial ? 'text-red-100' : 'text-slate-500'}`}>
                  <FiClock className={isSpecial ? 'text-red-200' : 'text-sky-600'} />
                  <span>{log.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-xs border ${
                    isSpecial ? 'bg-red-500 text-white border-red-400' : 'bg-white text-sky-700 border-sky-200'
                  }`}>
                    {log.user}
                  </span>
                </div>
                <p className="text-base font-medium mt-1">
                  {log.action}
                </p>
              </div>
              <button
                
              >
                {isSpecial ? (
                  <FiCheckSquare className="text-2xl" />
                ) : (
                  <FiSquare className="text-2xl" />
                )}
              </button>
            </div>
          );
        })}

        {initialLogs.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Không có dữ liệu nhật ký hệ thống.
          </div>
        )}
      </div>
    </MainLayout>
  );
};