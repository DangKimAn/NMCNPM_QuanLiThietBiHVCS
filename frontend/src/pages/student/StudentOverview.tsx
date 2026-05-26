import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiTool,
} from 'react-icons/fi';

import { StudentTeacherLayout } from '../../components/layout/StudentTeacherLayout';
import {
  StatusBadge,
  SummaryCard,
  TableHead,
} from '../../components/manager/common/ManagerCommon';
import { studentApi, type StudentReportItem } from '../../services/studentApi';

const getCurrentUserFromStorage = () => {
  const rawUser =
    localStorage.getItem('currentUser') ||
    localStorage.getItem('user') ||
    localStorage.getItem('authUser');

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const StudentOverview = () => {
  const currentUser = getCurrentUserFromStorage();

  const [reports, setReports] = useState<StudentReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);

      // Dùng đúng API giống trang "Phản ánh của tôi"
      const data = await studentApi.getMyReports();

      setReports(data);
    } catch (error) {
      console.error('Lỗi tải phản ánh gần đây:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => report.status === 'Mới tiếp nhận')
        .length,
      processing: reports.filter((report) => report.status === 'Đang xử lý')
        .length,
      resolved: reports.filter((report) => report.status === 'Đã xử lý')
        .length,
    };
  }, [reports]);

  const latestReports = reports.slice(0, 5);

  return (
    <StudentTeacherLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">
          Tổng quan người dùng
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Xin chào{' '}
          {currentUser?.fullName || currentUser?.username || 'Người dùng'}, bạn
          có thể gửi phản ánh và theo dõi tình trạng xử lý tại đây.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<FiFileText />}
          label="Tổng phản ánh"
          value={stats.total}
        />

        <SummaryCard
          icon={<FiAlertTriangle />}
          label="Mới tiếp nhận"
          value={stats.pending}
        />

        <SummaryCard
          icon={<FiTool />}
          label="Đang xử lý"
          value={stats.processing}
        />

        <SummaryCard
          icon={<FiCheckCircle />}
          label="Đã xử lý"
          value={stats.resolved}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Phản ánh gần đây</h2>

              <p className="text-sm text-slate-500 mt-1">
                Theo dõi nhanh các phản ánh bạn đã gửi.
              </p>
            </div>

            <Link
              to="/student/my-reports"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Xem tất cả
            </Link>
          </div>

          {loading && (
            <div className="p-8 text-center text-sm text-slate-500">
              Đang tải dữ liệu...
            </div>
          )}

          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <TableHead>Mã PA</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Thiết bị</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {latestReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        PA{String(report.id).padStart(3, '0')}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {report.room ? `Phòng ${report.room}` : 'Không có'}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {report.device}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={report.status} type="report" />
                      </td>
                    </tr>
                  ))}

                  {latestReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        Bạn chưa gửi phản ánh nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4">
            <FiEdit3 />
          </div>

          <h2 className="text-lg font-bold text-slate-800">
            Gửi phản ánh mới
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Khi phát hiện thiết bị trong phòng học bị lỗi, bạn có thể gửi phản
            ánh để cán bộ quản lý thiết bị tiếp nhận xử lý.
          </p>

          <Link
            to="/student/reports"
            className="mt-5 inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Gửi phản ánh
          </Link>
        </div>
      </div>
    </StudentTeacherLayout>
  );
};

export default StudentOverview;