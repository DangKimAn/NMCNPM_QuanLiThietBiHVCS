// Trang tổng quan dành riêng cho Cán bộ quản lý thiết bị.
// Trang này hiển thị nhanh:
// - Tổng quan thiết bị
// - Thiết bị cần xử lý
// - Phản ánh mới
// - Thiết bị theo phòng
// - Phản ánh gần đây
// - Điều chuyển gần đây
//
// Điểm mới:
// Khi click vào card hoặc dòng dữ liệu, hệ thống sẽ chuyển sang trang chi tiết tương ứng.

import { useMemo } from 'react';
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
import {
  initialDevices,
  initialReports,
  initialTransfers,
  rooms,
} from '../../data/managerMockData';
import type { DeviceStatus } from '../../types/manager';

export const ManagerOverview = () => {
  const navigate = useNavigate();

  // Tính các số liệu tổng quan chính
  const overviewStats = useMemo(() => {
    const totalDevices = initialDevices.length;

    const activeDevices = initialDevices.filter(
      (device) => device.status === 'Hoạt động',
    ).length;

    const needHandleDevices = initialDevices.filter((device) =>
      ['Báo hỏng', 'Đang sửa', 'Bảo trì'].includes(device.status),
    ).length;

    const pendingReports = initialReports.filter(
      (report) => report.status === 'Mới tiếp nhận',
    ).length;

    return {
      totalDevices,
      activeDevices,
      needHandleDevices,
      pendingReports,
    };
  }, []);

  // Thống kê thiết bị theo từng trạng thái
  const deviceStatusStats = useMemo(() => {
    const statuses: DeviceStatus[] = [
      'Hoạt động',
      'Báo hỏng',
      'Đang sửa',
      'Bảo trì',
      'Thanh lý',
    ];

    return statuses.map((status) => ({
      status,
      count: initialDevices.filter((device) => device.status === status).length,
    }));
  }, []);

  // Thống kê thiết bị theo từng phòng học
  const roomStats = useMemo(() => {
    return rooms.map((room) => {
      const roomDevices = initialDevices.filter((device) => device.room === room);

      const activeCount = roomDevices.filter(
        (device) => device.status === 'Hoạt động',
      ).length;

      const needHandleCount = roomDevices.filter(
        (device) => device.status !== 'Hoạt động',
      ).length;

      return {
        room,
        total: roomDevices.length,
        active: activeCount,
        needHandle: needHandleCount,
      };
    });
  }, []);

  // Lấy tối đa 5 phản ánh mới nhất
  const latestReports = useMemo(() => {
    return [...initialReports].slice(0, 5);
  }, []);

  // Lấy tối đa 5 lịch sử điều chuyển gần nhất
  const latestTransfers = useMemo(() => {
    return [...initialTransfers].slice(0, 5);
  }, []);

  return (
    <MainLayout>
      {/* Tiêu đề trang */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Tổng quan cán bộ quản lý</h1>

        <p className="text-sm text-slate-500 mt-1">
          Theo dõi nhanh tình trạng thiết bị, phản ánh sự cố và hoạt động điều chuyển.
        </p>
      </div>

      {/* Các card thống kê chính có thể click */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <OverviewLinkCard
          to="/manager/devices"
          icon={<FiBox />}
          label="Tổng thiết bị"
          value={overviewStats.totalDevices}
          note="Xem danh mục"
        />

        <OverviewLinkCard
          to={`/manager/devices?status=${encodeURIComponent('Hoạt động')}`}
          icon={<FiCheckCircle />}
          label="Đang hoạt động"
          value={overviewStats.activeDevices}
          note="Lọc thiết bị"
        />

        <OverviewLinkCard
          to="/manager/devices?status=need-handle"
          icon={<FiTool />}
          label="Thiết bị cần xử lý"
          value={overviewStats.needHandleDevices}
          note="Báo hỏng / sửa / bảo trì"
        />

        <OverviewLinkCard
          to={`/manager/incidents?status=${encodeURIComponent('Mới tiếp nhận')}`}
          icon={<FiAlertTriangle />}
          label="Phản ánh mới"
          value={overviewStats.pendingReports}
          note="Xem phản ánh"
        />
      </div>

      {/* Khu vực thống kê thiết bị và phòng học */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Thống kê thiết bị theo trạng thái */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-800">Tình trạng thiết bị</h2>

            <p className="text-sm text-slate-500 mt-1">
              Bấm vào từng trạng thái để lọc danh sách thiết bị.
            </p>
          </div>

          <div className="p-6 space-y-2">
            {deviceStatusStats.map((item) => {
              const percent =
                initialDevices.length === 0
                  ? 0
                  : Math.round((item.count / initialDevices.length) * 100);

              return (
                <Link
                  key={item.status}
                  to={`/manager/devices?status=${encodeURIComponent(item.status)}`}
                  className="block p-3 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={item.status} type="device" />

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

        {/* Thống kê thiết bị theo phòng học */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-800">Thiết bị theo phòng học</h2>

            <p className="text-sm text-slate-500 mt-1">
              Bấm vào từng phòng để xem thiết bị của phòng đó.
            </p>
          </div>

          <div className="p-6 space-y-4">
            {roomStats.map((room) => (
              <Link
                key={room.room}
                to={`/manager/devices?room=${encodeURIComponent(room.room)}`}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FiLayers />
                  </div>

                  <div>
                    <p className="font-bold text-slate-800">Phòng {room.room}</p>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Hoạt động: {room.active} / Tổng: {room.total}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      room.needHandle > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {room.needHandle}
                  </p>

                  <p className="text-xs text-slate-400">cần xử lý</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Khu vực phản ánh mới và điều chuyển gần đây */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Danh sách phản ánh mới nhất */}
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
                {latestReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() =>
                      navigate(`/manager/incidents?report=${encodeURIComponent(report.id)}`)
                    }
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {report.id}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {report.room}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-slate-700">{report.device}</p>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {report.date}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={report.status} type="report" />
                    </td>
                  </tr>
                ))}

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

        {/* Lịch sử điều chuyển gần đây */}
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
              <div key={transfer.id} className="p-5 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800">{transfer.deviceName}</p>

                    <p className="text-sm text-slate-500 mt-1">
                      {transfer.fromRoom} → {transfer.toRoom}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {transfer.date} • {transfer.handler}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {transfer.id}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-3">{transfer.reason}</p>
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

      {/* Gợi ý thao tác nhanh */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <FiClock />
        </div>

        <div>
          <h3 className="font-bold text-slate-800">Gợi ý kiểm tra hôm nay</h3>

          <p className="text-sm text-slate-600 mt-1">
            Ưu tiên xử lý các thiết bị đang báo hỏng hoặc đang sửa, đồng thời kiểm tra các
            phản ánh mới tiếp nhận để cập nhật trạng thái kịp thời.
          </p>
        </div>
      </div>
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

// Card thống kê có thể bấm để chuyển sang trang chi tiết
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