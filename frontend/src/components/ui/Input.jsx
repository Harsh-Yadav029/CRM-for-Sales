import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  icon: Icon,
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
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3.5 text-slate-450 shrink-0 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-input border border-line bg-white py-2.5 text-xs text-ink placeholder:text-slate-400 focus:outline-none transition-all ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } ${error ? 'border-danger focus:border-danger focus:ring-danger/25' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="text-[10px] font-bold text-danger mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;
export { Input };
