import { useState } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { FiMessageSquare, FiFilter, FiCheckCircle, FiTool, FiEye, FiX, FiSave } from 'react-icons/fi';

export const IncidentManager = () => {
  // 1. Mock Data: Danh sách phản ánh từ Giảng viên/Sinh viên
  const [reports, setReports] = useState([
    { id: 'PA001', sender: 'SV001 - Phạm Văn D', room: 'A201', device: 'Máy chiếu Panasonic', issue: 'Máy chiếu cắm điện không lên đèn, có mùi khét.', date: '04/05/2026', status: 'Mới tiếp nhận' },
    { id: 'PA002', sender: 'GV001 - Lê Văn C', room: 'B105', device: 'Điều hòa Daikin', issue: 'Điều hòa không mát, bị chảy nước xuống bàn.', date: '03/05/2026', status: 'Đang xử lý' },
    { id: 'PA003', sender: 'SV005 - Trần Thị E', room: 'A202', device: 'Dây cáp HDMI', issue: 'Mất đầu chuyển type-C sang HDMI tại bàn giáo viên.', date: '01/05/2026', status: 'Đã xử lý' },
  ]);

  const [filterStatus, setFilterStatus] = useState('All');
  
  // State cho Modal Cập nhật trạng thái
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Mở Modal xem chi tiết & cập nhật
  const handleOpenModal = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // Xử lý lưu trạng thái mới
  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    setReports(reports.map(r => r.id === selectedReport.id ? selectedReport : r));
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  // Định dạng màu sắc cho Badges trạng thái
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Mới tiếp nhận': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Đang xử lý': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Đã xử lý': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Lọc dữ liệu theo trạng thái
  const filteredReports = filterStatus === 'All' 
    ? reports 
    : reports.filter(r => r.status === filterStatus);

  return (
    <MainLayout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Phản ánh báo hỏng</h2>
          <p className="text-sm text-slate-500 mt-1">Tiếp nhận và xử lý các sự cố thiết bị do Giảng viên, Sinh viên gửi lên</p>
        </div>
        
        {/* Bộ lọc trạng thái */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-slate-400" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Mới tiếp nhận">Mới tiếp nhận</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Đã xử lý">Đã xử lý</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách phản ánh */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mã PA</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Người gửi</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Phòng / Thiết bị</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Nội dung tóm tắt</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Thời gian</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{report.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{report.sender}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    <span className="font-semibold text-blue-600">{report.room}</span>
                    <br/><span className="text-xs text-slate-500">{report.device}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={report.issue}>
                    {report.issue}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{report.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(report.status)}`}>
                      {report.status === 'Đã xử lý' && <FiCheckCircle className="inline mr-1 mb-0.5" />}
                      {report.status === 'Đang xử lý' && <FiTool className="inline mr-1 mb-0.5" />}
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button 
                      onClick={() => handleOpenModal(report)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors flex items-center inline-flex"
                    >
                      <FiEye className="mr-1.5" /> Xử lý
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Không có phiếu phản ánh nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi tiết và Cập nhật trạng thái */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Chi tiết phản ánh - {selectedReport.id}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><FiX className="text-xl" /></button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-5">
              {/* Thông tin readonly */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block text-xs">Người gửi:</span> <span className="font-medium text-slate-800">{selectedReport.sender}</span></div>
                  <div><span className="text-slate-500 block text-xs">Thời gian:</span> <span className="font-medium text-slate-800">{selectedReport.date}</span></div>
                  <div><span className="text-slate-500 block text-xs">Phòng học:</span> <span className="font-bold text-blue-600">{selectedReport.room}</span></div>
                  <div><span className="text-slate-500 block text-xs">Thiết bị lỗi:</span> <span className="font-medium text-slate-800">{selectedReport.device}</span></div>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-1">Nội dung chi tiết:</span>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{selectedReport.issue}</p>
                </div>
              </div>

              {/* Phần cập nhật trạng thái */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cập nhật tiến độ xử lý</label>
                <select 
                  value={selectedReport.status}
                  onChange={(e) => setSelectedReport({...selectedReport, status: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Mới tiếp nhận">Mới tiếp nhận (Chưa xử lý)</option>
                  <option value="Đang xử lý">Đang xử lý (Chờ linh kiện / Đang sửa)</option>
                  <option value="Đã xử lý">Đã xử lý xong (Hoạt động bình thường)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Đóng</button>
                <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm">
                  <FiSave className="mr-2" /> Lưu trạng thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};