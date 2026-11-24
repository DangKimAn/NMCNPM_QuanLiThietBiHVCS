import { useEffect, useMemo, useState, useCallback } from 'react';
import { FiMonitor, FiSearch, FiTool } from 'react-icons/fi';

import { StudentTeacherLayout } from '../../components/layout/StudentTeacherLayout';
import {
  StatusBadge,
  SummaryCard,
} from '../../components/manager/common/ManagerCommon';
import { studentApi, type StudentRoomEquipment as RoomEquipment } from '../../services/studentApi';
import { socket } from '../../services/socket';
import type { DeviceStatus } from '../../types/manager';

const sortRooms = (rooms: RoomEquipment[]) =>
  [...rooms].sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));

const sortEquipments = (eqs: RoomEquipment['equipments']) =>
  [...eqs].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

export const StudentRoomEquipment = () => {
  const [rooms, setRooms] = useState<RoomEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await studentApi.getRoomsWithEquipments();
      const sorted = sortRooms(data).map((r) => ({
        ...r,
        equipments: sortEquipments(r.equipments),
      }));
      setRooms(sorted);
    } catch (error) {
      console.error('Lỗi tải danh sách phòng:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    socket.on('equipment_transferred', loadData);
    return () => { socket.off('equipment_transferred', loadData); };
  }, [loadData]);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const kw = search.toLowerCase();
    return rooms.filter(
      (r) =>
        r.code.toLowerCase().includes(kw) ||
        r.name.toLowerCase().includes(kw) ||
        (r.building && r.building.toLowerCase().includes(kw)),
    );
  }, [rooms, search]);

  const totalEquipments = rooms.reduce(
    (sum, r) => sum + r.equipments.reduce((s, e) => s + e.quantity, 0),
    0,
  );

  const brokenCount = rooms.reduce(
    (sum, r) =>
      sum +
      r.equipments.filter((e) => e.status === 'Báo hỏng' || e.status === 'Đang sửa')
        .length,
    0,
  );

  const toggleRoom = (roomId: number) => {
    setSelectedRoom(selectedRoom === roomId ? null : roomId);
  };

  return (
    <StudentTeacherLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">
          Thiết bị trong phòng học
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tra cứu danh sách thiết bị được trang bị tại các phòng học.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={<FiMonitor />}
          label="Phòng học"
          value={rooms.length}
        />
        <SummaryCard
          icon={<FiTool />}
          label="Thiết bị"
          value={totalEquipments}
        />
        <SummaryCard
          icon={<FiTool />}
          label="Cần xử lý"
          value={brokenCount}
        />
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm phòng theo mã, tên hoặc tòa nhà..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-sm text-slate-500">
          Đang tải dữ liệu...
        </div>
      )}

      {!loading && filteredRooms.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-500">
          {search ? 'Không tìm thấy phòng phù hợp.' : 'Chưa có phòng học nào.'}
        </div>
      )}

      <div className="space-y-4">
        {!loading &&
          filteredRooms.map((room) => (
            <div
              key={room.roomId}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleRoom(room.roomId)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {room.code.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800">
                      {room.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {room.code}
                      {room.building ? ` - ${room.building}` : ''}
                      {room.floor != null ? ` - Tầng ${room.floor}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {room.equipments.length} thiết bị
                  </span>
                  <StatusBadge status={room.status as DeviceStatus} type="device" />
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      selectedRoom === room.roomId ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {selectedRoom === room.roomId && (
                <div className="border-t border-slate-200">
                  {room.equipments.length === 0 && (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">
                      Phòng chưa có thiết bị nào.
                    </div>
                  )}

                  {room.equipments.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                              Mã TB
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                              Tên thiết bị
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                              Loại
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                              Số lượng
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {room.equipments.map((eq) => (
                            <tr
                              key={eq.equipmentId}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-6 py-3 text-sm font-mono text-slate-600">
                                {eq.equipmentCode ||
                                  `TB${String(eq.equipmentId).padStart(6, '0')}`}
                              </td>
                              <td className="px-6 py-3 text-sm font-medium text-slate-800">
                                {eq.name}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-600">
                                {eq.category}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-600">
                                {eq.quantity}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                <StatusBadge status={eq.status as DeviceStatus} type="device" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </StudentTeacherLayout>
  );
};

export default StudentRoomEquipment;
