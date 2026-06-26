import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiClock, FiCheckSquare, FiSquare, FiRefreshCw, FiGlobe, FiMonitor } from 'react-icons/fi';
import { adminApi } from '../../services/adminApi';
import type { BackendAuditLog } from '../../services/adminApi';

const PAGE_SIZE = 20;

const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
};

// Smart page window: tối đa 5 số trang + dấu ...
const buildPageWindow = (current: number, total: number): (number | '...')[] => {
  const pages: (number | '...')[] = [];
  const delta = 2;
  const left = current - delta;
  const right = current + delta;

  if (left > 2) {
    pages.push(1, '...');
  } else {
    for (let i = 1; i < left; i++) pages.push(i);
  }
  for (let i = Math.max(1, left); i <= Math.min(total, right); i++) pages.push(i);
  if (right < total - 1) {
    pages.push('...', total);
  } else {
    for (let i = right + 1; i <= total; i++) pages.push(i);
  }
  return pages;
};

export const SystemLogView = () => {
  const [logs, setLogs] = useState<BackendAuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialLogs, setSpecialLogs] = useState<Set<number>>(new Set());

  // Filter state
  const [filterUsername, setFilterUsername] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getAuditLogs({
        limit: PAGE_SIZE,
        page,
        username: filterUsername.trim() || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      setLogs(result.logs);
      setTotalLogs(result.total);

      const markedIds = new Set(
        result.logs.filter((log) => log.isMarked).map((log) => log.logId)
      );
      setSpecialLogs(markedIds);
    } catch (err: any) {
      setError('Không thể tải nhật ký hệ thống. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
    loadLogs(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadLogs(page);
  };

  useEffect(() => {
    loadLogs(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSpecialLog = async (logId: number) => {
    const isCurrentlyMarked = specialLogs.has(logId);
    const newMarkedState = !isCurrentlyMarked;

    setSpecialLogs((prev) => {
      const next = new Set(prev);
      if (newMarkedState) next.add(logId);
      else next.delete(logId);
      return next;
    });

    try {
      await adminApi.markAuditLog(logId, newMarkedState);
    } catch (error) {
      console.error('Lỗi khi đánh dấu log:', error);
      setSpecialLogs((prev) => {
        const next = new Set(prev);
        if (!newMarkedState) next.add(logId);
        else next.delete(logId);
        return next;
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));
  const pageWindow = buildPageWindow(currentPage, totalPages);

  const PaginationBar = () => (
    totalPages > 1 ? (
      <div className="flex items-center justify-end gap-1 mb-3">
        <button
          type="button"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Trước
        </button>

        {pageWindow.map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page as number)}
              className={`h-8 w-8 rounded-lg border text-sm font-medium ${
                page === currentPage
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    ) : null
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Nhật ký hệ thống"
        description="Xem và theo dõi các hoạt động, thao tác của người dùng trong hệ thống."
      />

      {/* Thanh lọc */}
      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Tên đăng nhập
          </label>
          <input
            type="text"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            placeholder="Tìm theo username..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Từ ngày
          </label>
          <input
            type="datetime-local"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Đến ngày
          </label>
          <input
            type="datetime-local"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={handleFilter}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all"
        >
          <FiRefreshCw />
          Lọc / Làm mới
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10 text-slate-500 mt-4">
          Đang tải nhật ký...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mt-4">
          {error}
          <button type="button" onClick={() => loadLogs(currentPage)} className="ml-3 text-sm underline">
            Thử lại
          </button>
        </div>
      )}

      {/* Danh sách log */}
      {!loading && !error && (
        <div className="mt-4">
          {/* Pagination trên */}
          <PaginationBar />

          <div className="space-y-3">
            {logs.map((log) => {
              const isSpecial = specialLogs.has(log.logId);
              const username = log.user?.username ?? `User #${log.userId}`;
              const timestamp = formatDate(log.createdAt);

              return (
                <div
                  key={log.logId}
                  onClick={() => toggleSpecialLog(log.logId)}
                  title={isSpecial ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                  className={`flex items-center justify-between p-4 rounded-lg border shadow-sm transition-all duration-300 cursor-pointer ${
                    isSpecial
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-sky-50 text-slate-900 border-sky-100'
                  }`}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {/* Dòng 1: thời gian + user + method + status + IP */}
                    <div
                      className={`flex flex-wrap items-center gap-2 text-sm font-medium ${
                        isSpecial ? 'text-red-100' : 'text-slate-500'
                      }`}
                    >
                      <FiClock className={isSpecial ? 'text-red-200' : 'text-sky-600'} />
                      <span>{timestamp}</span>

                      <span
                        className={`px-2 py-0.5 rounded text-xs border font-semibold ${
                          isSpecial
                            ? 'bg-red-500 text-white border-red-400'
                            : 'bg-white text-sky-700 border-sky-200'
                        }`}
                      >
                        {username}
                      </span>

                      {log.method && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            isSpecial
                              ? 'bg-red-500 text-white border-red-400'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          }`}
                        >
                          {log.method}
                        </span>
                      )}

                      {log.statusCode && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs border ${
                            isSpecial
                              ? 'bg-red-500 text-white border-red-400'
                              : log.statusCode >= 400
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      )}

                      {log.ipAddress && (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${
                            isSpecial
                              ? 'bg-red-500 text-white border-red-400'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                          title={`IP: ${log.ipAddress}`}
                        >
                          <FiGlobe className="text-[10px]" />
                          {log.ipAddress}
                        </span>
                      )}
                    </div>

                    {/* Dòng 2: mô tả hành động */}
                    <p className="text-base font-medium mt-1">
                      {log.action} →{' '}
                      <span className="font-bold">{log.target}</span>
                      {log.targetId > 0 && ` #${log.targetId}`}
                    </p>

                    {/* Dòng 3: route */}
                    {log.route && (
                      <p
                        className={`text-xs mt-0.5 font-mono truncate ${
                          isSpecial ? 'text-red-200' : 'text-slate-400'
                        }`}
                      >
                        {log.route}
                      </p>
                    )}

                    {/* Dòng 4: User-Agent */}
                    {log.userAgent && (
                      <p
                        className={`flex items-center gap-1 text-[11px] mt-0.5 truncate max-w-lg ${
                          isSpecial ? 'text-red-300' : 'text-slate-400'
                        }`}
                        title={log.userAgent}
                      >
                        <FiMonitor className="shrink-0" />
                        <span className="truncate">{log.userAgent}</span>
                      </p>
                    )}
                  </div>

                  <button type="button" className="ml-3 shrink-0">
                    {isSpecial ? (
                      <FiCheckSquare className="text-2xl" />
                    ) : (
                      <FiSquare className="text-2xl" />
                    )}
                  </button>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                Không có dữ liệu nhật ký hệ thống.
              </div>
            )}
          </div>

          {/* Pagination dưới */}
          <PaginationBar />
        </div>
      )}
    </AdminLayout>
  );
};

export const SystemLogViewer = SystemLogView;
export default SystemLogView;
