import React from 'react';

const Card = ({
  children,
  variant = 'raised', // raised, flat
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-surface rounded-card transition-premium';
  
  const variants = {
    raised: 'border border-line/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5',
    flat: 'border border-line/60'
  };

  const clickableClasses = onClick ? 'cursor-pointer hover:border-gold/40 hover:scale-[1.005]' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${clickableClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
export { Card };
