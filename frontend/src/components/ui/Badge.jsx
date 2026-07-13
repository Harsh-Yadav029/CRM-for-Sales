import React from 'react';

const Badge = ({
  children,
  variant = 'neutral', // neutral, success, warning, danger, gold
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase select-none border';

  const variants = {
    neutral: 'bg-[#FAF9F6] text-slate-600 border-line',
    success: 'bg-emerald-50 text-success border-emerald-250',
    warning: 'bg-amber-50 text-warning border-amber-250',
    danger: 'bg-red-50 text-danger border-red-250',
    gold: 'bg-gold-soft text-[#705d00] border-gold/30'
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant] || variants.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
export { Badge };
