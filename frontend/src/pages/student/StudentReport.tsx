import { useState, useRef } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FiSend, FiClock, FiCheckCircle, FiImage, FiX } from 'react-icons/fi';
import { PageHeader } from '../../components/ui/PageHeader';
export const StudentReport = () => {
  const [reports] = useState([
    { id: 'PA001', room: 'A201', issue: 'Máy chiếu bị mờ, không rõ chữ', date: '04/05/2026', status: 'Đã xử lý' },
    { id: 'PA002', room: 'B105', issue: 'Điều hòa không mát', date: '02/05/2026', status: 'Đang chờ' },
  ]);

  // States quản lý Form
  const [room, setRoom] = useState('');
  const [device, setDevice] = useState('');
  const [description, setDescription] = useState('');

  // States quản lý hình ảnh
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hàm xử lý khi chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Dùng FileReader để tạo preview URL cho ảnh
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hàm xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Hàm gửi phản ánh
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Gắn API call bằng Axios gửi FormData (text + file) lên NestJS
    console.log("Dữ liệu gửi đi:", { room, device, description, imageFile });
    alert('Đã gửi phản ánh thành công!');

    // Reset form sau khi gửi
    setRoom('');
    setDevice('');
    setDescription('');
    handleRemoveImage();
  };

  return (
    <MainLayout>


      <PageHeader
        title="Phản ánh sự cố thiết bị"
        description="Báo cáo các thiết bị hỏng hóc hoặc sự cố trong phòng học"

      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Form gửi phản ánh */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tạo phiếu mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phòng học</label>
                <select
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Chọn phòng học...</option>
                  <option value="A201">Phòng A201</option>
                  <option value="A202">Phòng A202</option>
                  <option value="B105">Phòng B105</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thiết bị gặp sự cố</label>
                <select
                  required
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Chọn thiết bị...</option>
                  <option value="Máy chiếu">Máy chiếu</option>
                  <option value="Micro / Âm thanh">Micro / Âm thanh</option>
                  <option value="Điều hòa">Điều hòa</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Máy chiếu cắm điện không lên đèn..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* KHU VỰC UPLOAD ẢNH */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh đính kèm (không bắt buộc)</label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-28 w-auto rounded-lg border border-slate-200 object-cover shadow-sm" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 shadow-md transition-colors"
                      title="Xóa ảnh"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <FiImage className="text-2xl mb-1" />
                    <span className="text-sm font-medium">Click để tải ảnh lên</span>
                    <span className="text-xs mt-0.5 text-slate-400">Hỗ trợ JPG, PNG</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm">
                <FiSend className="mr-2" /> Gửi phản ánh
              </button>
            </form>
          </div>
        </div>

        {/* Cột phải: Lịch sử phản ánh (Giữ nguyên) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Lịch sử phản ánh của bạn</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {reports.map((report, index) => (
                <div key={index} className="p-6 flex items-start justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-sm font-bold text-slate-800">{report.room}</span>
                      <span className="text-xs text-slate-500">{report.date}</span>
                    </div>
                    <p className="text-sm text-slate-600">{report.issue}</p>
                  </div>
                  <div>
                    {report.status === 'Đã xử lý' ? (
                      <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <FiCheckCircle className="mr-1.5" /> {report.status}
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <FiClock className="mr-1.5" /> {report.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};