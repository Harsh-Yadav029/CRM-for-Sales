import React from 'react';

const Select = ({
  label,
  id,
  value,
  onChange,
  error,
  required = false,
  options = [], // [{ value: '...', label: '...' }]
  placeholder,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full font-sans ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-ink/75 select-none">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full rounded-input border border-line bg-white py-2.5 px-4 text-xs text-ink focus:outline-none transition-all ${
          error ? 'border-danger focus:border-danger focus:ring-danger/25' : ''
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[10px] font-bold text-danger mt-0.5">{error}</span>}
    </div>
  );
};

export default Select;
export { Select };
