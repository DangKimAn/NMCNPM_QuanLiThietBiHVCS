import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { BaseModal } from '../../components/ui/BaseModal';
import { formConfigApi, type FormFieldConfig } from '../../services/formConfigApi';
import { clearFormConfigCache } from '../../hooks/useFormConfig';

const formLabels: Record<string, string> = {
  incident_report: 'Báo cáo sự cố',
  equipment: 'Nhập thiết bị',
  user_create: 'Tạo tài khoản',
  incident_handle: 'Xử lý báo cáo',
  notification: 'Thông báo',
};

const fieldTypeLabels: Record<string, string> = {
  text: 'Text',
  select: 'Select',
  textarea: 'Textarea',
  date: 'Date',
  email: 'Email',
  password: 'Password',
  number: 'Number',
};

export const FormConfigPage = () => {
  const [forms, setForms] = useState<string[]>([]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newField, setNewField] = useState({
    fieldKey: '',
    label: '',
    fieldType: 'text',
    required: false,
    visible: true,
    options: '',
    placeholder: '',
  });

  useEffect(() => {
    formConfigApi
      .getAllForms()
      .then(setForms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      formConfigApi
        .getConfig(selectedForm)
        .then((data) => {
          setFields(data.sort((a, b) => a.sortOrder - b.sortOrder));
        })
        .catch(() => setFields([]))
        .finally(() => setLoading(false));
    }
  }, [selectedForm]);

  const updateField = (index: number, key: keyof FormFieldConfig, value: any) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleAddField = () => {
    if (!newField.fieldKey.trim() || !newField.label.trim()) {
      alert('Vui lòng nhập Field key và Nhãn.');
      return;
    }
    if (fields.some((f) => f.fieldKey === newField.fieldKey.trim())) {
      alert(`Field key "${newField.fieldKey}" đã tồn tại trong form này.`);
      return;
    }
    const newEntry: FormFieldConfig = {
      formConfigId: 0,
      formKey: selectedForm!,
      fieldKey: newField.fieldKey.trim(),
      label: newField.label.trim(),
      fieldType: newField.fieldType,
      required: newField.required,
      visible: newField.visible,
      sortOrder: fields.length,
      options: newField.fieldType === 'select' && newField.options.trim()
        ? JSON.stringify(newField.options.split(',').map((s) => s.trim()).filter(Boolean))
        : null,
      placeholder: newField.placeholder.trim() || null,
    };
    setFields((prev) => [...prev, newEntry]);
    setShowAddModal(false);
    setNewField({ fieldKey: '', label: '', fieldType: 'text', required: false, visible: true, options: '', placeholder: '' });
  };

  const handleDeleteField = (fieldKey: string) => {
    if (!window.confirm(`Xóa trường "${fieldKey}" khỏi form này?`)) return;
    setFields((prev) => prev.filter((f) => f.fieldKey !== fieldKey));
  };

  const handleSave = async () => {
    if (!selectedForm) return;
    setSaving(true);
    setSuccessMessage('');
    try {
      const updated = fields.map((f, i) => ({ ...f, sortOrder: i }));
      await formConfigApi.updateConfig(
        selectedForm,
        updated.map((f) => ({
          fieldKey: f.fieldKey,
          label: f.label,
          fieldType: f.fieldType,
          required: f.required,
          visible: f.visible,
          sortOrder: f.sortOrder,
          options: f.options,
          placeholder: f.placeholder,
        })),
      );
      setFields(updated);
      clearFormConfigCache(selectedForm);
      setSuccessMessage('Lưu cấu hình form thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const updated = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Cấu hình Form"
        description="Tùy chỉnh các trường hiển thị trên form của hệ thống"
      />

      {successMessage && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Danh sách form
            </h3>
            <div className="space-y-1">
              {forms.map((form) => (
                <button
                  key={form}
                  type="button"
                  onClick={() => setSelectedForm(form)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedForm === form
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {formLabels[form] || form}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedForm && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              Chọn một form bên trái để cấu hình
            </div>
          )}

          {selectedForm && loading && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              Đang tải...
            </div>
          )}

          {selectedForm && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-800">
                    {formLabels[selectedForm] || selectedForm}
                  </h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {fields.length} trường
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm trường
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 font-semibold text-slate-600 w-8">#</th>
                      <th className="text-left py-2 px-2 font-semibold text-slate-600">Field key</th>
                      <th className="text-left py-2 px-2 font-semibold text-slate-600">Nhãn</th>
                      <th className="text-left py-2 px-2 font-semibold text-slate-600">Kiểu</th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-600">Bắt buộc</th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-600">Hiển thị</th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-600">Sắp xếp</th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-600 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.fieldKey} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-2 text-slate-400 text-xs">{index + 1}</td>
                        <td className="py-2 px-2">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {field.fieldKey}
                          </code>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, 'label', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={field.fieldType}
                            onChange={(e) => updateField(index, 'fieldType', e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          >
                            {Object.entries(fieldTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={field.visible}
                            onChange={(e) => updateField(index, 'visible', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveField(index, 'up')}
                              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={index === fields.length - 1}
                              onClick={() => moveField(index, 'down')}
                              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.fieldKey)}
                            className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                            title="Xóa trường"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {fields.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Chưa có trường nào. Nhấn "Thêm trường" để thêm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BaseModal
        isOpen={showAddModal}
        title="Thêm trường mới"
        onClose={() => setShowAddModal(false)}
        onSubmit={(e) => { e.preventDefault(); handleAddField(); }}
        submitText="Thêm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Field key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newField.fieldKey}
              onChange={(e) => setNewField({ ...newField, fieldKey: e.target.value })}
              placeholder="VD: priority, phoneNumber..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nhãn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="VD: Mức độ ưu tiên, Số điện thoại..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kiểu</label>
              <select
                value={newField.fieldType}
                onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {Object.entries(fieldTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                Bắt buộc
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newField.visible}
                  onChange={(e) => setNewField({ ...newField, visible: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                Hiển thị
              </label>
            </div>
          </div>
          {newField.fieldType === 'select' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Options (cách nhau bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={newField.options}
                onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                placeholder="VD: Cao, Trung bình, Thấp"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={newField.placeholder}
              onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
              placeholder="VD: Nhập số điện thoại..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </BaseModal>
    </AdminLayout>
  );
};

export default FormConfigPage;
