// Component quản lý phản ánh báo hỏng dành cho Cán bộ quản lý thiết bị.
// Có hỗ trợ đọc query trên URL.
// Ví dụ:
// /manager/incidents?status=Mới tiếp nhận
// /manager/incidents?room=A201
// /manager/incidents?report=PA001

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

import { MainLayout } from '../layout/MainLayout';
import { initialReports, reportStatuses } from '../../data/managerMockData';
import type { IncidentReport, ReportStatus } from '../../types/manager';
import {
  FieldInput,
  FieldSelect,
  FieldTextArea,
  getNow,
  Modal,
  StatusBadge,
  SummaryCard,
  TableHead,
} from './common/ManagerCommon';

export const IncidentManager = () => {
  // Đọc tham số trên URL
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const reportIdFromUrl = searchParams.get('report');

  const [reports, setReports] = useState<IncidentReport[]>(initialReports);

  // Nếu URL có ?report=PA001 thì tự động mở modal chi tiết phản ánh đó
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(() => {
    const foundReport = initialReports.find((report) => report.id === reportIdFromUrl);

    if (!foundReport) return null;

    return {
      ...foundReport,
      handlerName: foundReport.handlerName || 'Cán bộ QLTB',
      handlerNote: foundReport.handlerNote || '',
    };
  });

  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All');
  const [filterRoom, setFilterRoom] = useState(searchParams.get('room') || 'All');

  // Khi URL thay đổi, tự động cập nhật bộ lọc hoặc mở phản ánh tương ứng
  useEffect(() => {
    const params = new URLSearchParams(searchKey);

    setFilterStatus(params.get('status') || 'All');
    setFilterRoom(params.get('room') || 'All');

    const reportId = params.get('report');

    if (reportId) {
      const foundReport = reports.find((report) => report.id === reportId);

      if (foundReport) {
        setSelectedReport({
          ...foundReport,
          handlerName: foundReport.handlerName || 'Cán bộ QLTB',
          handlerNote: foundReport.handlerNote || '',
        });
      }
    }
  }, [searchKey]);

  const roomOptions = useMemo(() => {
    return Array.from(new Set(reports.map((report) => report.room)));
  }, [reports]);

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

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => report.status === 'Mới tiếp nhận').length,
      processing: reports.filter((report) => report.status === 'Đang xử lý').length,
      resolved: reports.filter((report) => report.status === 'Đã xử lý').length,
    };
  }, [reports]);

  const openDetailModal = (report: IncidentReport) => {
    setSelectedReport({
      ...report,
      handlerName: report.handlerName || 'Cán bộ QLTB',
      handlerNote: report.handlerNote || '',
    });
  };

  const closeDetailModal = () => {
    setSelectedReport(null);
    setSearchParams({});
  };

  const updateReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedReport) return;

    const updatedReport: IncidentReport = {
      ...selectedReport,
      handledAt: getNow(),
    };

    setReports((current) =>
      current.map((report) => (report.id === updatedReport.id ? updatedReport : report)),
    );

    setSelectedReport(null);
    setSearchParams({});
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Quản lý phản ánh báo hỏng</h1>

        <p className="text-sm text-slate-500 mt-1">
          Tiếp nhận, xem chi tiết và cập nhật trạng thái xử lý các phản ánh sự cố thiết bị.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<FiClock />} label="Tổng phản ánh" value={stats.total} />
        <SummaryCard icon={<FiAlertTriangle />} label="Mới tiếp nhận" value={stats.pending} />
        <SummaryCard icon={<FiTool />} label="Đang xử lý" value={stats.processing} />
        <SummaryCard icon={<FiCheckCircle />} label="Đã xử lý" value={stats.resolved} />
      </div>

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
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{report.id}</td>

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

      {selectedReport && (
        <Modal
          title={`Chi tiết phản ánh - ${selectedReport.id}`}
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
            value={selectedReport.handlerName || ''}
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
    </MainLayout>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="grid grid-cols-3 gap-3 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="col-span-2 font-semibold text-slate-800">{value}</span>
  </div>
);