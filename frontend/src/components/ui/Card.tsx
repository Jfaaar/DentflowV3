import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  variant?: 'default' | 'glass' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  noPadding = false,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default:
      'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-soft',
    glass:
      'glass rounded-2xl shadow-elevated',
    elevated:
      'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200/60 dark:border-surface-700/60 shadow-elevated',
  };

  return (
    <div
      className={cn(
        'transition-all duration-200',
        variants[variant],
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
