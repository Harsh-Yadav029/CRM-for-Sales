import React from 'react';

const Card = ({
  children,
  variant = 'raised', // raised, flat
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-surface rounded-card transition-all duration-200';
  
  const variants = {
    raised: 'border border-line shadow-card hover:shadow-card-hover',
    flat: 'border border-line'
  };

  const clickableClasses = onClick ? 'cursor-pointer hover:border-gold/50' : '';

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
