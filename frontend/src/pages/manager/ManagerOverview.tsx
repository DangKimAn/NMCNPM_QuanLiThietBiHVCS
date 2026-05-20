import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCornerUpRight,
  FiLayers,
  FiTool,
} from 'react-icons/fi';

import { MainLayout } from '../../components/layout/MainLayout';
import { StatusBadge, TableHead } from '../../components/manager/common/ManagerCommon';
import { managerApi, type DashboardOverview } from '../../services/managerApi';
import type { DeviceStatus, ReportStatus } from '../../types/manager';

// Trang tổng quan lấy dữ liệu thật từ backend
export const ManagerOverview = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Gọi API tổng quan khi mở trang
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const data = await managerApi.getOverview();
        setOverview(data);
      } catch (error) {
        console.error(error);
        setErrorMessage('Không thể tải dữ liệu tổng quan từ backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const equipmentSummary = overview?.equipmentSummary;
  const reportSummary = overview?.reportSummary;

  const totalDevices = equipmentSummary?.total || 0;

  const latestReports = overview?.latestReports || [];
  const latestTransfers = overview?.latestTransfers || [];
  const deviceStatusStats = overview?.deviceStatusStats || [];
  const roomStats = overview?.roomStats || [];

  const statusLinks = useMemo(() => {
    return deviceStatusStats.map((item) => {
      let frontendStatus: DeviceStatus = 'Hoạt động';

      if (item.status === 'GOOD') frontendStatus = 'Hoạt động';
      if (item.status === 'BROKEN') frontendStatus = 'Báo hỏng';
      if (item.status === 'UNDER_REPAIR') frontendStatus = 'Đang sửa';
      if (item.status === 'DISCARDED') frontendStatus = 'Thanh lý';

      return {
        ...item,
        frontendStatus,
      };
    });
  }, [deviceStatusStats]);

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Tổng quan cán bộ quản lý</h1>

        <p className="text-sm text-slate-500 mt-1">
          Theo dõi nhanh tình trạng thiết bị, phản ánh sự cố và hoạt động điều chuyển.
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Đang tải dữ liệu tổng quan...
        </div>
      )}

      {!loading && errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-6">
          {errorMessage}
        </div>
      )}

      {!loading && overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <OverviewLinkCard
              to="/manager/devices"
              icon={<FiBox />}
              label="Tổng thiết bị"
              value={equipmentSummary?.total || 0}
              note="Xem danh mục"
            />

            <OverviewLinkCard
              to={`/manager/devices?status=${encodeURIComponent('Hoạt động')}`}
              icon={<FiCheckCircle />}
              label="Đang hoạt động"
              value={equipmentSummary?.active || 0}
              note="Lọc thiết bị"
            />

            <OverviewLinkCard
              to="/manager/devices?status=need-handle"
              icon={<FiTool />}
              label="Thiết bị cần xử lý"
              value={equipmentSummary?.needHandle || 0}
              note="Báo hỏng / đang sửa"
            />

            <OverviewLinkCard
              to={`/manager/incidents?status=${encodeURIComponent('Mới tiếp nhận')}`}
              icon={<FiAlertTriangle />}
              label="Phản ánh mới"
              value={reportSummary?.pending || 0}
              note="Xem phản ánh"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-800">Tình trạng thiết bị</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Bấm vào từng trạng thái để lọc danh sách thiết bị.
                </p>
              </div>

              <div className="p-6 space-y-2">
                {statusLinks.map((item) => {
                  const percent =
                    totalDevices === 0 ? 0 : Math.round((item.count / totalDevices) * 100);

                  return (
                    <Link
                      key={item.status}
                      to={`/manager/devices?status=${encodeURIComponent(item.frontendStatus)}`}
                      className="block p-3 rounded-xl hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={item.frontendStatus} type="device" />

                        <span className="text-sm font-semibold text-slate-700">
                          {item.count} thiết bị
                        </span>
                      </div>

                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-800">Thiết bị theo phòng học</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Bấm vào từng phòng để xem thiết bị của phòng đó.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {roomStats.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Chưa có dữ liệu phòng học.
                  </p>
                )}

                {roomStats.map((room) => (
                  <Link
                    key={room.roomId}
                    to={`/manager/devices?room=${encodeURIComponent(room.code)}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FiLayers />
                      </div>

                      <div>
                        <p className="font-bold text-slate-800">Phòng {room.code}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hoạt động: {room.activeQuantity} / Tổng: {room.totalQuantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          room.needHandleQuantity > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {room.needHandleQuantity}
                      </p>
                      <p className="text-xs text-slate-400">cần xử lý</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">Phản ánh mới nhất</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Bấm vào từng phản ánh để mở chi tiết xử lý.
                  </p>
                </div>

                <FiAlertTriangle className="text-rose-500 text-xl" />
              </div>

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
                    {latestReports.map((report) => {
                      const statusMap: Record<string, ReportStatus> = {
                        PENDING: 'Mới tiếp nhận',
                        PROCESSING: 'Đang xử lý',
                        RESOLVED: 'Đã xử lý',
                        REJECTED: 'Từ chối',
                      };

                      return (
                        <tr
                          key={report.reportId}
                          onClick={() =>
                            navigate(`/manager/incidents?report=${report.reportId}`)
                          }
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-slate-800">
                            PA{String(report.reportId).padStart(3, '0')}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {report.room?.code || ''}
                          </td>

                          <td className="px-6 py-4 text-sm">
                            <p className="font-semibold text-slate-700">
                              {report.equipment?.name || 'Không xác định'}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm">
                            <StatusBadge
                              status={statusMap[report.status] || 'Mới tiếp nhận'}
                              type="report"
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {latestReports.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                          Chưa có phản ánh nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">Điều chuyển gần đây</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Theo dõi các thiết bị được chuyển giữa các phòng.
                  </p>
                </div>

                <FiCornerUpRight className="text-indigo-500 text-xl" />
              </div>

              <div className="divide-y divide-slate-100">
                {latestTransfers.map((transfer) => (
                  <div key={transfer.transferId} className="p-5 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-800">
                          {transfer.equipment?.name || 'Thiết bị'}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {transfer.fromRoom?.code || ''} → {transfer.toRoom?.code || ''}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {transfer.transferredAt?.slice(0, 10)}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        DC{String(transfer.transferId).padStart(3, '0')}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-3">
                      {transfer.note || 'Không có ghi chú'}
                    </p>
                  </div>
                ))}

                {latestTransfers.length === 0 && (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Chưa có lịch sử điều chuyển.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FiClock />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">Gợi ý kiểm tra hôm nay</h3>

              <p className="text-sm text-slate-600 mt-1">
                Ưu tiên xử lý các thiết bị đang báo hỏng hoặc đang sửa, đồng thời kiểm tra
                các phản ánh mới tiếp nhận để cập nhật trạng thái kịp thời.
              </p>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

interface OverviewLinkCardProps {
  to: string;
  icon: ReactNode;
  label: string;
  value: number;
  note?: string;
}

const OverviewLinkCard = ({ to, icon, label, value, note }: OverviewLinkCardProps) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-md transition"
  >
    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
      {icon}
    </div>

    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black text-slate-800 mt-0.5">{value}</p>
      {note && <p className="text-xs text-blue-600 mt-1">{note}</p>}
    </div>
  </Link>
);