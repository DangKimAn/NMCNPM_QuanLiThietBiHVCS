import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit3,
  FiMonitor,
  FiRefreshCw,
} from 'react-icons/fi';

import { StudentTeacherLayout } from '../../components/layout/StudentTeacherLayout';
import {
  FieldTextArea,
  SummaryCard,
} from '../../components/manager/common/ManagerCommon';
import {
  createStudentReport,
  getCurrentStudentUser,
  mockEquipments,
  mockRooms,
  type StudentEquipmentOption,
  type StudentRoomOption,
} from '../../data/studentMockData';

interface ReportForm {
  roomId: string;
  equipmentId: string;
  reportContent: string;
}

const emptyForm: ReportForm = {
  roomId: '',
  equipmentId: '',
  reportContent: '',
};

export const StudentReport = () => {
  const currentUser = getCurrentStudentUser();

  const [rooms, setRooms] = useState<StudentRoomOption[]>([]);
  const [equipments, setEquipments] = useState<StudentEquipmentOption[]>([]);

  const [form, setForm] = useState<ReportForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = () => {
    try {
      setLoading(true);
      setErrorMessage('');

      setRooms(mockRooms);
      setEquipments(mockEquipments);

      setForm((current) => ({
        ...current,
        roomId: current.roomId || String(mockRooms[0]?.roomId || ''),
        equipmentId: current.equipmentId || String(mockEquipments[0]?.equipmentId || ''),
      }));
    } catch (error) {
      console.error(error);
      setErrorMessage('Không thể tải dữ liệu mẫu phòng học hoặc thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEquipments = useMemo(() => {
    const selectedRoomId = Number(form.roomId);

    const byRoom = equipments.filter(
      (equipment) => equipment.roomId === selectedRoomId,
    );

    return byRoom.length > 0 ? byRoom : equipments;
  }, [equipments, form.roomId]);

  const selectedRoom = rooms.find(
    (room) => String(room.roomId) === form.roomId,
  );

  const selectedEquipment = equipments.find(
    (equipment) => String(equipment.equipmentId) === form.equipmentId,
  );

  const submitReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSuccessMessage('');

    if (!form.roomId) {
      alert('Vui lòng chọn phòng học.');
      return;
    }

    if (!form.equipmentId) {
      alert('Vui lòng chọn thiết bị cần phản ánh.');
      return;
    }

    if (!form.reportContent.trim()) {
      alert('Vui lòng nhập nội dung phản ánh.');
      return;
    }

    try {
      setSubmitting(true);

      createStudentReport({
        reporterId: currentUser.userId,
        roomId: Number(form.roomId),
        equipmentId: Number(form.equipmentId),
        reportContent: form.reportContent.trim(),
      });

      setSuccessMessage(
        'Gửi phản ánh thành công. Cán bộ quản lý thiết bị sẽ tiếp nhận xử lý.',
      );

      setForm({
        roomId: form.roomId,
        equipmentId: form.equipmentId,
        reportContent: '',
      });
    } catch (error) {
      console.error(error);
      alert('Không thể gửi phản ánh.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentTeacherLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">
          Gửi phản ánh thiết bị
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Khi phát hiện thiết bị trong phòng học bị lỗi, bạn có thể gửi phản ánh
          để cán bộ quản lý tiếp nhận.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 flex items-center gap-2">
          <FiCheckCircle />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={<FiMonitor />} label="Phòng học" value={rooms.length} />

        <SummaryCard
          icon={<FiAlertTriangle />}
          label="Thiết bị"
          value={equipments.length}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <FiEdit3 />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Người gửi
            </p>

            <p className="text-lg font-black text-slate-800 mt-0.5">
              {currentUser.fullName}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Đang tải dữ liệu phòng học và thiết bị...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Thông tin phản ánh
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Chọn phòng học, thiết bị và mô tả rõ sự cố để việc xử lý nhanh
                  hơn.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                <FiRefreshCw className="mr-2" />
                Làm mới
              </button>
            </div>

            <form onSubmit={submitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Phòng học
                </label>

                <select
                  value={form.roomId}
                  onChange={(e) => {
                    const selectedRoomId = Number(e.target.value);

                    const firstEquipmentInRoom = equipments.find(
                      (equipment) => equipment.roomId === selectedRoomId,
                    );

                    setForm({
                      ...form,
                      roomId: e.target.value,
                      equipmentId: firstEquipmentInRoom
                        ? String(firstEquipmentInRoom.equipmentId)
                        : '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.code} - {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Thiết bị gặp sự cố
                </label>

                <select
                  value={form.equipmentId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      equipmentId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  {filteredEquipments.map((equipment) => (
                    <option
                      key={equipment.equipmentId}
                      value={equipment.equipmentId}
                    >
                      {equipment.name} - Phòng {equipment.roomCode}
                    </option>
                  ))}
                </select>
              </div>

              <FieldTextArea
                label="Nội dung phản ánh"
                value={form.reportContent}
                placeholder="Ví dụ: Máy chiếu không lên hình, loa bị rè, điều hòa không hoạt động..."
                onChange={(value) =>
                  setForm({
                    ...form,
                    reportContent: value,
                  })
                }
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <p className="text-xs text-slate-500">
                  Người gửi:{' '}
                  <span className="font-semibold">{currentUser.fullName}</span> -
                  Tài khoản:{' '}
                  <span className="font-semibold">{currentUser.username}</span>
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi phản ánh'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800">
              Thông tin đã chọn
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <InfoBox
                label="Phòng học"
                value={
                  selectedRoom
                    ? `${selectedRoom.code} - ${selectedRoom.name}`
                    : 'Chưa chọn'
                }
              />

              <InfoBox
                label="Thiết bị"
                value={selectedEquipment?.name || 'Chưa chọn'}
              />

              <InfoBox
                label="Trạng thái thiết bị"
                value={selectedEquipment?.status || 'Không có'}
              />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm font-bold text-slate-800">Lưu ý</p>

              <p className="text-sm text-slate-600 mt-1">
                Bạn nên mô tả rõ lỗi, thời điểm phát hiện và tình trạng thiết bị
                để cán bộ quản lý xử lý nhanh hơn.
              </p>
            </div>

            <Link
              to="/student/my-reports"
              className="mt-5 inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
            >
              Xem phản ánh của tôi
            </Link>
          </div>
        </div>
      )}
    </StudentTeacherLayout>
  );
};

interface InfoBoxProps {
  label: string;
  value: string;
}

const InfoBox = ({ label, value }: InfoBoxProps) => (
  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
    <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
    <p className="font-bold text-slate-800 mt-1">{value}</p>
  </div>
);

export default StudentReport;