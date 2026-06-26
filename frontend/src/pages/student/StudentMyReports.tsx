import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiSearch,
  FiTool,
} from 'react-icons/fi';

import { StudentTeacherLayout } from '../../components/layout/StudentTeacherLayout';
import {
  Modal,
  StatusBadge,
  SummaryCard,
  TableHead,
} from '../../components/manager/common/ManagerCommon';
import type { ReportStatus } from '../../types/manager';
import { getCurrentStudentUser } from '../../data/studentMockData';
import { studentApi, type StudentReportItem } from '../../services/studentApi';

const reportStatuses: ReportStatus[] = [
  'Mới tiếp nhận',
  'Đang xử lý',
  'Đã xử lý',
  'Từ chối',
];

export const StudentMyReports = () => {
  const currentUser = getCurrentStudentUser();

  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const [reports, setReports] = useState<StudentReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<StudentReportItem | null>(null);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All');

  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await studentApi.getMyReports();
        setReports(data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách phản ánh:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentUser.userId]);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);

    setKeyword(params.get('keyword') || '');
    setFilterStatus(params.get('status') || 'All');

    const reportParam = params.get('report');

    if (reportParam && reports.length > 0) {
      const cleanId = reportParam.replace(/\D/g, '');
      const foundReport = reports.find((report) => report.id === cleanId);

      if (foundReport) {
        setSelectedReport(foundReport);
      }
    }
  }, [searchKey, reports]);

  const filteredReports = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    return reports.filter((report) => {
      const matchKeyword =
        !value ||
        report.id.toLowerCase().includes(value) ||
        report.room.toLowerCase().includes(value) ||
        report.device.toLowerCase().includes(value) ||
        report.issue.toLowerCase().includes(value);
      const matchStatus = filterStatus === 'All' || report.status === filterStatus;
      return matchKeyword && matchStatus;
    });
  }, [reports, keyword, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => report.status === 'Mới tiếp nhận').length,
      processing: reports.filter((report) => report.status === 'Đang xử lý').length,
      resolved: reports.filter((report) => report.status === 'Đã xử lý').length,
    };
  }, [reports]);

  const closeModal = () => {
    setSelectedReport(null);

    const params = new URLSearchParams(searchParams);
    params.delete('report');
    setSearchParams(params);
  };

  return (
    <StudentTeacherLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">
          Phản ánh của tôi
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Xem lại các phản ánh đã gửi và theo dõi trạng thái xử lý từ cán bộ quản lý thiết bị.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<FiClock />} label="Tổng phản ánh" value={stats.total} />
        <SummaryCard icon={<FiAlertTriangle />} label="Mới tiếp nhận" value={stats.pending} />
        <SummaryCard icon={<FiTool />} label="Đang xử lý" value={stats.processing} />
        <SummaryCard icon={<FiCheckCircle />} label="Đã xử lý" value={stats.resolved} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm mã phản ánh, phòng, thiết bị, nội dung..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="All">Tất cả trạng thái</option>

          {reportStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Đang tải danh sách phản ánh...
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <TableHead>Mã PA</TableHead>
                  <TableHead>Phòng / Thiết bị</TableHead>
                  <TableHead>Nội dung phản ánh</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead alignRight>Thao tác</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      PA{String(report.id).padStart(3, '0')}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-slate-700">
                        Phòng {report.room || 'Không có'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.device}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                      <p className="line-clamp-2">{report.issue}</p>
                      {report.handlerNote && (
                        <p className="text-xs text-slate-400 mt-1">
                          Phản hồi: {report.handlerNote}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {report.date}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={report.status} type="report" />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                        >
                          <FiEye className="mr-1.5" />
                          Chi tiết
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

          {/* Pagination footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Hiển thị{' '}
              <span className="font-semibold text-slate-700">
                {filteredReports.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                –{Math.min(currentPage * PAGE_SIZE, filteredReports.length)}
              </span>
              {' '}/ <span className="font-semibold text-slate-700">{filteredReports.length}</span> phản ánh
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium border ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <Modal
          title={`Chi tiết phản ánh - PA${String(selectedReport.id).padStart(3, '0')}`}
          onClose={closeModal}
          submitText="Đóng"
          onSubmit={(e) => {
            e.preventDefault();
            closeModal();
          }}
        >
          <InfoRow label="Phòng học" value={selectedReport.room} />
          <InfoRow label="Thiết bị" value={selectedReport.device} />
          <InfoRow label="Ngày gửi" value={selectedReport.date} />

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Nội dung phản ánh
            </p>

            <p className="text-sm text-slate-800 mt-1">
              {selectedReport.issue}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Trạng thái
            </p>

            <div className="mt-2">
              <StatusBadge status={selectedReport.status} type="report" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Phản hồi xử lý
            </p>

            <p className="text-sm text-slate-800 mt-1">
              {selectedReport.handlerNote || 'Chưa có phản hồi xử lý.'}
            </p>
          </div>

          {selectedReport.handledAt && (
            <InfoRow label="Thời gian xử lý" value={selectedReport.handledAt} />
          )}
        </Modal>
      )}
    </StudentTeacherLayout>
  );
};

interface InfoRowProps {
  label: string;
  value?: string;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="grid grid-cols-3 gap-3 text-sm">
    <span className="text-slate-500">{label}</span>

    <span className="col-span-2 font-semibold text-slate-800">
      {value || 'Không có'}
    </span>
  </div>
);

export default StudentMyReports;