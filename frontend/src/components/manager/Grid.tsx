import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface DeviceGridProps {
  devices: any[];
  uniqueRooms: string[];
  getStatusStyle: (status: string) => string;
  onEdit: (device: any) => void;      // Nhận hàm Edit
  onDelete: (deviceId: string) => void; // Nhận hàm Delete
}

export const Grid = ({ devices, uniqueRooms, getStatusStyle, onEdit, onDelete }: DeviceGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {uniqueRooms.map(room => {
        const roomDevices = devices.filter(d => d.room === room);
        const activeCount = roomDevices.filter(d => d.status === 'Hoạt động').length;
        
        return (
          <div key={room} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Phòng {room}</h3>
              <span className="text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                {activeCount}/{roomDevices.length} Hoạt động
              </span>
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-64">
              <ul className="space-y-4">
                {roomDevices.map(device => (
                  <li key={device.id} className="flex justify-between items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    {/* Cột trái: Thông tin thiết bị */}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{device.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{device.id} • {device.type}</p>
                      <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusStyle(device.status)}`}>
                        {device.status}
                      </span>
                    </div>
                    
                    {/* Cột phải: Các nút thao tác */}
                    <div className="flex space-x-2 mt-1">
                      <button 
                        onClick={() => onEdit(device)} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button 
                        onClick={() => onDelete(device.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" 
                        title="Xóa"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};