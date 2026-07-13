import React from 'react';

const EmptyState = ({
  title = 'No one on this path yet',
  description = 'Start planning your first opportunity.',
  action,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-line rounded-card bg-surface ${className}`} {...props}>
      {/* Gold Blueprint Path Illustration */}
      <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
        {/* Schematic Box */}
        <div className="absolute inset-0 border border-gold/40 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 border border-dashed border-gold/30 rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-gold/60 text-3xl font-light">architecture</span>
          </div>
        </div>
        {/* Custom gold dashed connecting lines */}
        <div className="absolute top-1/2 left-[-20%] w-[20%] border-t border-dashed border-gold/40"></div>
        <div className="absolute top-1/2 right-[-20%] w-[20%] border-t border-dashed border-gold/40"></div>
      </div>

      <h3 className="font-display text-sm text-ink uppercase tracking-wide mb-2 font-black">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
export { EmptyState };
