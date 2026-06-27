import { useState, useEffect, useRef } from 'react';
import { FiSave, FiUpload } from 'react-icons/fi';
import { BaseModal } from './BaseModal'; 

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'email' | 'password';
  options?: string[];
  required?: boolean;
  readOnlyOnEdit?: boolean;
  defaultValue?: string;
  fullWidth?: boolean;
}

interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  titleAdd: string;
  titleEdit: string;
  fields: FormField[];
  initialData?: any;
  extraActions?: React.ReactNode; 
}

export const DynamicFormModal = ({
  isOpen, onClose, onSave, titleAdd, titleEdit, fields, initialData, extraActions
}: DynamicFormModalProps) => {
  
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- LOGIC EXCEL ĐƯỢC ĐÓNG GÓI TẠI ĐÂY ---
  const fileInputRef = useRef<HTMLInputElement>(null);


  
  const renderExcelButton = () => {
    if (isEditMode) return null;
    return (
      <>
        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <FiUpload className="mr-2" /> Nhập từ Excel
        </button>
      </>
    );
  };


  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData(initialData);
      } else {
        const defaultData: any = {};
        fields.forEach(f => { defaultData[f.name] = f.defaultValue || ''; });
        setFormData(defaultData);
      }
    }
  }, [isOpen, initialData, fields]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      // Nếu không phải edit mode, xóa form để tiếp tục nhập
      if (!isEditMode) {
        const defaultData: any = {};
        fields.forEach(f => { defaultData[f.name] = f.defaultValue || ''; });
        setFormData(defaultData);
      }
    } catch (error) {
      // Bỏ qua lỗi vì component cha đã handle (ví dụ: alert)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      title={isEditMode ? titleEdit : titleAdd}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={isEditMode ? 'Cập nhật' : 'Lưu lại'}
      submitIcon={<FiSave />}
      isSubmitting={isSubmitting}
      extraActions={
        <div className="flex items-center space-x-3">
          {renderExcelButton()} 
          
          {/* Cộng thêm các extraActions khác nếu có */}
          {!isEditMode && extraActions} 
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => {
          const isReadOnly = isEditMode && field.readOnlyOnEdit;
          return (
            <div key={field.name} className={field.fullWidth ? 'col-span-2' : 'col-span-1'}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  disabled={isReadOnly}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${isReadOnly ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                >
                  <option value="" disabled>-- Chọn {field.label.toLowerCase()} --</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  readOnly={isReadOnly}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${isReadOnly ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
};