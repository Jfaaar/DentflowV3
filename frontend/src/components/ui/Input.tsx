import React, { forwardRef, useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  floatingLabel?: boolean;
  iconPrefix?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, floatingLabel, iconPrefix: Icon, id, ...props }, ref) => {
    const reactId = useId();
    const inputId = id ?? reactId;

    if (floatingLabel) {
      return (
        <div className="w-full">
          <div className="relative">
            {Icon && (
              <Icon
                size={18}
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none"
                aria-hidden
              />
            )}
            <input
              id={inputId}
              ref={ref}
              type={type}
              placeholder={label ?? ' '}
              className={cn(
                'peer flex h-12 w-full rounded-xl border bg-white/80 dark:bg-surface-900/60 px-4 pt-3 pb-1 text-sm text-surface-900 dark:text-surface-100 transition-all duration-200',
                Icon ? 'ps-10' : '',
                'placeholder:text-transparent',
                'border-surface-300 dark:border-surface-700',
                'focus-visible:outline-none focus:border-primary-500 focus:shadow-glow',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error
                  ? 'border-red-500 focus:border-red-500 focus:shadow-none'
                  : 'hover:border-surface-400 dark:hover:border-surface-600',
                className
              )}
              {...props}
            />
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'pointer-events-none absolute start-4 top-1 text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 transition-all duration-200',
                  Icon ? 'start-10' : '',
                  'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-surface-400 dark:peer-placeholder-shown:text-surface-500',
                  'peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:tracking-wider peer-focus:text-primary-600 dark:peer-focus:text-primary-400'
                )}
              >
                {label}
              </label>
            )}
          </div>
          {error && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-slide-up">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none"
              aria-hidden
            />
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-xl border bg-white dark:bg-surface-900 px-4 py-2 text-sm text-surface-900 dark:text-surface-100 transition-all duration-200',
              Icon ? 'ps-10' : '',
              'placeholder:text-surface-400 dark:placeholder:text-surface-600',
              'border-surface-300 dark:border-surface-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-0 focus:border-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'hover:border-surface-400 dark:hover:border-surface-600',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 animate-slide-up">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
