import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border bg-white dark:bg-surface-900 px-4 py-2 text-sm text-surface-900 dark:text-surface-100 transition-all duration-200",
            "placeholder:text-surface-400 dark:placeholder:text-surface-600",
            "border-surface-300 dark:border-surface-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0 focus:border-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-red-500 focus-visible:ring-red-500" 
              : "hover:border-surface-400 dark:hover:border-surface-600",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 animate-slide-up">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";