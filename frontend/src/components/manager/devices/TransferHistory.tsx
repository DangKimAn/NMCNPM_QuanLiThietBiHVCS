// Component hiển thị lịch sử điều chuyển thiết bị.
// Mỗi dòng là một lần chuyển thiết bị từ phòng cũ sang phòng mới.

import type { TransferLog } from '../../../types/manager';
import { TableHead } from '../common/ManagerCommon';

interface TransferHistoryProps {
  transfers: TransferLog[]; // Danh sách lịch sử điều chuyển
}

export const TransferHistory = ({ transfers }: TransferHistoryProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800">Lịch sử điều chuyển thiết bị</h3>

        <p className="text-sm text-slate-500 mt-1">
          Theo dõi thiết bị được chuyển từ phòng này sang phòng khác.
        </p>
      </div>

      {/* Bảng lịch sử điều chuyển thiết bị */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200">
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Phòng cũ</TableHead>
              <TableHead>Phòng mới</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Lý do</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transfers.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{log.id}</td>

                <td className="px-6 py-4 text-sm text-slate-700">
                  <p className="font-semibold">{log.deviceName}</p>

                  <p className="text-xs text-slate-400">
                    {log.deviceId} • {log.handler}
                  </p>
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">{log.fromRoom}</td>
                <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{log.toRoom}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.date}</td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-md">{log.reason}</td>
              </tr>
            ))}

            {/* Hiển thị khi chưa có lịch sử điều chuyển */}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  Chưa có lịch sử điều chuyển.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};