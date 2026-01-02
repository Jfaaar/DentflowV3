import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  children, 
  noPadding = false,
  ...props 
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-soft transition-all duration-200",
        !noPadding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};