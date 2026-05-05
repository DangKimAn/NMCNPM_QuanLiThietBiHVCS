import { ReactNode, useState } from 'react';
import { FiHome, FiMonitor, FiTool, FiUser, FiBell, FiSearch, FiSettings, FiLogOut, FiLock } from 'react-icons/fi';

export const MainLayout = ({ children }: { children: ReactNode }) => {
  // State để quản lý việc ẩn/hiện menu của User
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center border-b border-slate-200">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">HVCS<span className="text-slate-800">.Edu</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu Chính</p>
          <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors">
            <FiHome className="mr-3 text-lg" /> Tổng quan
          </a>
          <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 transition-colors">
            <FiMonitor className="mr-3 text-lg" /> Quản lý thiết bị
          </a>
          <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors">
            <FiTool className="mr-3 text-lg" /> Phản ánh sự cố
          </a>
          
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Hệ thống</p>
          <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors">
            <FiUser className="mr-3 text-lg" /> Quản lý tài khoản
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 w-96">
            <FiSearch className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thiết bị, phòng học..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            />
          </div>
          
          <div className="flex items-center space-x-5">
            <button className="text-slate-400 hover:text-blue-600 transition">
              <FiBell className="text-xl" />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            
            {/* Vùng chứa Avatar và Dropdown */}
            <div className="relative">
              {/* Nút bấm để toggle menu */}
              <div 
                className="flex items-center gap-3 cursor-pointer select-none hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-700">Cán bộ QLTB</p>
                  <p className="text-xs text-slate-500">Quản trị viên</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold shadow-md">
                  CB
                </div>
              </div>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">Thông tin tài khoản</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">canbo_qltb@hvcs.edu.vn</p>
                  </div>
                  
                  <div className="py-1">
                    <a href="#" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                      <FiSettings className="mr-3 text-slate-400" /> Cài đặt tài khoản
                    </a>
                    <a href="#" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                      <FiLock className="mr-3 text-slate-400" /> Đổi mật khẩu
                    </a>
                  </div>
                  
                  <div className="border-t border-slate-100 py-1">
                    <a href="#" className="flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                      <FiLogOut className="mr-3 text-rose-500" /> Đăng xuất
                    </a>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};