import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, ghost, danger
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-sans font-semibold text-xs transition-premium focus:outline-none rounded-btn py-3 px-5 select-none active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-gold hover:bg-gold/90 text-ink shadow-sm',
    secondary: 'border border-line hover:bg-gold-soft text-ink bg-white',
    ghost: 'hover:bg-gold-soft text-ink',
    danger: 'bg-danger hover:bg-danger/90 text-white shadow-sm'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon size={14} className="shrink-0" />}
      {children}
    </button>
  );
};

export default Button;
export { Button };
