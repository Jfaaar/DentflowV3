import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  children,
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft shadow-primary-200 dark:shadow-none active:scale-[0.98]',
    secondary: 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-700',
    outline: 'border border-surface-300 dark:border-surface-600 bg-transparent hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200',
    ghost: 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200 dark:shadow-none',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10 p-2 flex items-center justify-center',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-surface-900 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
      {children}
    </button>
  );
};