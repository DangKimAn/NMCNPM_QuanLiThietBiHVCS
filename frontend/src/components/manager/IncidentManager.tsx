// Component quản lý phản ánh báo hỏng dành cho Cán bộ quản lý thiết bị.
// Bản này đã nối API backend thật:
// - GET /reports
// - PATCH /reports/:reportId/handle
//
// Có hỗ trợ URL query:
// /manager/incidents?status=Mới tiếp nhận
// /manager/incidents?room=A201
// /manager/incidents?report=1

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFilter,
  FiSearch,
  FiTool,
} from 'react-icons/fi';

import { ManagerLayout } from '../../components/layout/ManagerLayout';
import type { IncidentReport, ReportStatus } from '../../types/manager';
import { managerApi } from '../../services/managerApi';
import {
  FieldInput,
  FieldSelect,
  FieldTextArea,
  Modal,
  StatusBadge,
  SummaryCard,
  TableHead,
} from './common/ManagerCommon';

// Danh sách trạng thái phản ánh hiển thị trên frontend
const reportStatuses: ReportStatus[] = [
  'Mới tiếp nhận',
  'Đang xử lý',
  'Đã xử lý',
  'Từ chối',
];

export const IncidentManager = () => {
  // Đọc tham số từ URL
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const highlightId = searchParams.get('highlight');

  // State lưu danh sách phản ánh lấy từ backend
  const [reports, setReports] = useState<IncidentReport[]>([]);

  // State lưu phản ánh đang được chọn để xem chi tiết hoặc xử lý
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);

  // State loading/error
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // State tìm kiếm và lọc
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All');
  const [filterRoom, setFilterRoom] = useState(searchParams.get('room') || 'All');

  // Lấy ID cán bộ đang đăng nhập.
  // Nếu chưa có userId trong localStorage thì tạm dùng 1.
  // Lưu ý: trong database phải có userId = 1, nếu không backend sẽ báo "Người xử lý không tồn tại".
  const getCurrentUserId = () => {
    const rawUser = localStorage.getItem('currentUser');

    if (!rawUser) return 1;

    try {
      const user = JSON.parse(rawUser);
      return Number(user.userId || user.id || 1);
    } catch {
      return 1;
    }
  };

  // Gọi API lấy danh sách phản ánh từ backend
  const fetchReports = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await managerApi.getReports();
      setReports(data);
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể tải danh sách phản ánh từ backend.');
    } finally {
      setLoading(false);
    }
  };

  // Khi mở trang thì gọi API
  useEffect(() => {
    fetchReports();
  }, []);

  // Khi URL thay đổi thì cập nhật bộ lọc
  useEffect(() => {
    const params = new URLSearchParams(searchKey);

    setFilterStatus(params.get('status') || 'All');
    setFilterRoom(params.get('room') || 'All');

    const reportId = params.get('report');

    if (reportId && reports.length > 0) {
      const foundReport = reports.find((report) => report.id === reportId);

      if (foundReport) {
        setSelectedReport({
          ...foundReport,
          handlerName: foundReport.handlerName || 'Cán bộ QLTB',
          handlerNote: foundReport.handlerNote || '',
        });
      }
    }
  }, [searchKey, reports]);

  // Lấy danh sách phòng từ danh sách phản ánh để đưa vào bộ lọc
  const roomOptions = useMemo(() => {
    return Array.from(new Set(reports.map((report) => report.room).filter(Boolean)));
  }, [reports]);

  // Lọc phản ánh ở frontend theo từ khóa, trạng thái và phòng
  const filteredReports = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    return reports.filter((report) => {
      const matchKeyword =
        !lowerKeyword ||
        report.id.toLowerCase().includes(lowerKeyword) ||
        report.sender.toLowerCase().includes(lowerKeyword) ||
        report.room.toLowerCase().includes(lowerKeyword) ||
        report.device.toLowerCase().includes(lowerKeyword) ||
        report.issue.toLowerCase().includes(lowerKeyword);

      const matchStatus = filterStatus === 'All' || report.status === filterStatus;
      const matchRoom = filterRoom === 'All' || report.room === filterRoom;

      return matchKeyword && matchStatus && matchRoom;
    });
  }, [reports, keyword, filterStatus, filterRoom]);

  // Tính số liệu thống kê phản ánh
  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => report.status === 'Mới tiếp nhận').length,
      processing: reports.filter((report) => report.status === 'Đang xử lý').length,
      resolved: reports.filter((report) => report.status === 'Đã xử lý').length,
    };
  }, [reports]);

  // Mở modal chi tiết phản ánh
  const openDetailModal = (report: IncidentReport) => {
    setSelectedReport({
      ...report,
      handlerName: report.handlerName || 'Cán bộ QLTB',
      handlerNote: report.handlerNote || '',
    });
  };

  // Đóng modal.
  // Nếu URL có ?report=... thì xóa riêng tham số report, giữ lại status/room nếu có.
  const closeDetailModal = () => {
    setSelectedReport(null);

    const params = new URLSearchParams(searchParams);
    params.delete('report');
    setSearchParams(params);
  };

  // Cập nhật xử lý phản ánh lên backend
  const updateReport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedReport) return;

    try {
      await managerApi.handleReport(selectedReport.id, {
        status: selectedReport.status,
        handlerId: getCurrentUserId(),
        resolutionContent: selectedReport.handlerNote || '',
        result: selectedReport.handlerNote || '',
      });

      setSelectedReport(null);

      const params = new URLSearchParams(searchParams);
      params.delete('report');
      setSearchParams(params);

      await fetchReports();
    } catch (error) {
      console.error(error);
      alert(
        'Không thể cập nhật phản ánh. Kiểm tra backend, dữ liệu phản ánh hoặc userId người xử lý.',
      );
    }
  };

  return (
    <ManagerLayout>
      {/* Tiêu đề trang */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Quản lý phản ánh báo hỏng</h1>

        <p className="text-sm text-slate-500 mt-1">
          Tiếp nhận, xem chi tiết và cập nhật trạng thái xử lý các phản ánh sự cố thiết bị.
        </p>
      </div>

      {/* Thông báo lỗi khi không gọi được backend */}
      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">
          {errorMessage}
        </div>
      )}

      {/* Card thống kê số lượng phản ánh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<FiClock />} label="Tổng phản ánh" value={stats.total} />
        <SummaryCard icon={<FiAlertTriangle />} label="Mới tiếp nhận" value={stats.pending} />
        <SummaryCard icon={<FiTool />} label="Đang xử lý" value={stats.processing} />
        <SummaryCard icon={<FiCheckCircle />} label="Đã xử lý" value={stats.resolved} />
      </div>

      {/* Bộ lọc tìm kiếm phản ánh */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm mã, người gửi, phòng, thiết bị..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="All">Tất cả trạng thái</option>

            {reportStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="All">Tất cả phòng học</option>

            {roomOptions.map((room) => (
              <option key={room} value={room}>
                Phòng {room}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading khi đang gọi API */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Đang tải danh sách phản ánh...
        </div>
      )}

      {/* Bảng danh sách phản ánh báo hỏng */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <TableHead>Mã PA</TableHead>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Phòng / Thiết bị</TableHead>
                  <TableHead>Nội dung sự cố</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead alignRight>Thao tác</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className={`transition-colors ${
                      highlightId === String(report.id)
                        ? 'bg-amber-50 border-amber-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      PA{String(report.id).padStart(3, '0')}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-slate-800">{report.sender}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{report.date}</p>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-slate-700">Phòng {report.room}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{report.device}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                      <p className="line-clamp-2">{report.issue}</p>

                      {report.handlerNote && (
                        <p className="text-xs text-slate-400 mt-1">
                          Ghi chú: {report.handlerNote}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={report.status} type="report" />
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openDetailModal(report)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                        >
                          <FiEye className="mr-1.5" />
                          Xử lý
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      Không tìm thấy phản ánh phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
            Hiển thị {filteredReports.length} phản ánh
          </div>
        </div>
      )}

      {/* Modal xem chi tiết và cập nhật xử lý phản ánh */}
      {selectedReport && (
        <Modal
          title={`Chi tiết phản ánh - PA${String(selectedReport.id).padStart(3, '0')}`}
          onClose={closeDetailModal}
          onSubmit={updateReport}
          submitText="Lưu xử lý"
        >
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <InfoRow label="Người gửi" value={selectedReport.sender} />
            <InfoRow label="Phòng học" value={selectedReport.room} />
            <InfoRow label="Thiết bị" value={selectedReport.device} />
            <InfoRow label="Thời gian gửi" value={selectedReport.date} />

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Nội dung sự cố</p>
              <p className="text-sm text-slate-800 mt-1">{selectedReport.issue}</p>
            </div>
          </div>

          <FieldSelect
            label="Trạng thái xử lý"
            value={selectedReport.status}
            options={reportStatuses}
            onChange={(value) =>
              setSelectedReport({
                ...selectedReport,
                status: value as ReportStatus,
              })
            }
          />

          <FieldInput
            label="Người xử lý"
            value={selectedReport.handlerName || 'Cán bộ QLTB'}
            onChange={(value) =>
              setSelectedReport({
                ...selectedReport,
                handlerName: value,
              })
            }
          />

          <FieldTextArea
            label="Ghi chú xử lý"
            value={selectedReport.handlerNote || ''}
            placeholder="Ví dụ: Đã kiểm tra, cần thay dây HDMI..."
            onChange={(value) =>
              setSelectedReport({
                ...selectedReport,
                handlerNote: value,
              })
            }
          />

          {selectedReport.handledAt && (
            <p className="text-xs text-slate-400">
              Cập nhật gần nhất: {selectedReport.handledAt}
            </p>
          )}
        </Modal>
      )}
    </ManagerLayout>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

// Dòng thông tin nhỏ dùng trong modal chi tiết phản ánh
const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="grid grid-cols-3 gap-3 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="col-span-2 font-semibold text-slate-800">{value || 'Không có'}</span>
  </div>
);