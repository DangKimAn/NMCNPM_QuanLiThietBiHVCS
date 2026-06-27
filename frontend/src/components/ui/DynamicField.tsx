import type { FormFieldConfig } from '../../services/formConfigApi';

interface DynamicFieldProps {
  config: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options?: string[];
  dynamicOptions?: { value: string; label: string }[];
}

export const DynamicField = ({
  config,
  value,
  onChange,
  disabled,
  options,
  dynamicOptions,
}: DynamicFieldProps) => {
  const fieldOptions =
    dynamicOptions ||
    (config.options ? JSON.parse(config.options) : options) ||
    [];

  const baseInputClass =
    'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500';
  const disabledClass = disabled
    ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
    : 'bg-white';

  switch (config.fieldType) {
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || ''}
            required={config.required}
            disabled={disabled}
            rows={4}
            className={`${baseInputClass} ${disabledClass} resize-none`}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            className={`${baseInputClass} ${disabledClass}`}
          >
            <option value="">
              -- {config.placeholder || `Chọn ${config.label.toLowerCase()}`} --
            </option>
            {fieldOptions.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            placeholder={config.placeholder || ''}
            className={`${baseInputClass} ${disabledClass}`}
          />
        </div>
      );

    case 'email':
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            placeholder={config.placeholder || ''}
            className={`${baseInputClass} ${disabledClass}`}
          />
        </div>
      );

    case 'password':
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            placeholder={config.placeholder || ''}
            className={`${baseInputClass} ${disabledClass}`}
          />
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            placeholder={config.placeholder || ''}
            className={`${baseInputClass} ${disabledClass}`}
          />
        </div>
      );
  }
};

export default DynamicField;
