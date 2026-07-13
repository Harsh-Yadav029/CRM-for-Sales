import React from 'react';

const Textarea = ({
  label,
  id,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  rows = 4,
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
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`w-full rounded-input border border-line bg-white py-2.5 px-4 text-xs text-ink placeholder:text-slate-400 focus:outline-none transition-all ${
          error ? 'border-danger focus:border-danger' : ''
        }`}
        {...props}
      />
      {error && <span className="text-[10px] font-bold text-danger mt-0.5">{error}</span>}
    </div>
  );
};

export default Textarea;
export { Textarea };
