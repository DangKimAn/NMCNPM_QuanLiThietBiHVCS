import { useRef, useState } from 'react';
import { FiCopy, FiUpload, FiX, FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import * as xlsx from 'xlsx';
import { adminApi } from '../../services/adminApi';

interface UserImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SUPPORTED_COLUMNS = [
  'Họ tên',
  'Username',
  'Email',
  'Số điện thoại',
  'Vai trò',
  'Mật khẩu tạm thời',
];

export const UserImportExcelModal = ({ isOpen, onClose, onSuccess }: UserImportExcelModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failedCount: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyStructure = () => {
    const headerRow = SUPPORTED_COLUMNS.join('\t');
    navigator.clipboard.writeText(headerRow);
    alert('Đã copy cấu trúc cột vào clipboard! Bạn có thể dán (Ctrl+V) vào Excel.');
  };

  const handleDownloadSample = () => {
    const sampleRow = ['Nguyễn Văn A', 'nva', 'nva@example.com', '0123456789', 'STUDENT', '123456aA@'];
    const worksheet = xlsx.utils.aoa_to_sheet([SUPPORTED_COLUMNS, sampleRow]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');
    xlsx.writeFile(workbook, 'User_Import_Mau.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Vui lòng chọn file Excel trước khi import!');
      return;
    }
    
    try {
      setIsImporting(true);
      setImportResult(null);
      const result = await adminApi.importUsers(file);
      setImportResult(result);
      if (result.successCount > 0) {
        onSuccess?.();
      }
      if (result.successCount > 0) {
        onSuccess();
      }
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 opacity-70 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="px-6 py-5 flex justify-between items-center relative z-10">
          <h3 className="text-lg font-bold text-slate-800">Import Excel tài khoản</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="px-6 pb-6 relative z-10">
          <div className="mb-5">
            <label className="block text-sm text-slate-600 mb-2">File Excel</label>
            <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-600">Các cột hỗ trợ</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1 text-xs text-emerald-600 font-medium px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition"
                >
                  <FiDownload />
                  Tải file mẫu
                </button>
                <button
                  type="button"
                  onClick={handleCopyStructure}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                >
                  <FiCopy />
                  Copy cấu trúc
                </button>
              </div>
            </div>
            
            <div className="border border-slate-200 rounded-xl p-3 bg-white overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-1">
                {SUPPORTED_COLUMNS.map((col, index) => (
                  <div key={index} className="text-sm font-semibold text-slate-700">
                    {col}
                  </div>
                ))}
              </div>
              <div className="h-1 bg-slate-200 rounded-full mt-2 w-full overflow-hidden">
                <div className="h-full bg-slate-400 w-1/3 rounded-full"></div>
              </div>
            </div>
          </div>

          {importResult && (
            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                Kết quả Import
              </h4>
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">
                  <FiCheckCircle />
                  Thành công: {importResult.successCount}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                  <FiAlertCircle />
                  Thất bại: {importResult.failedCount}
                </div>
              </div>
              
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">Chi tiết lỗi:</p>
                  <ul className="text-sm text-slate-600 max-h-32 overflow-y-auto space-y-1 bg-white p-2 rounded border border-slate-200">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-semibold text-red-500 whitespace-nowrap">Dòng {err.row}:</span>
                        <span>{err.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-full hover:bg-slate-50 transition disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !file}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-full hover:opacity-90 transition shadow-md disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FiUpload />
                  Import Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
