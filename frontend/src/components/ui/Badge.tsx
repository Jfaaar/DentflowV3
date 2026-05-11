import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'vital' | 'alert' | 'critical' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
}

const tones: Record<BadgeTone, string> = {
  vital:
    'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200',
  alert:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  critical:
    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  info:
    'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  neutral:
    'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200',
  primary:
    'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200',
};

const dotTones: Record<BadgeTone, string> = {
  vital: 'bg-accent-500',
  alert: 'bg-amber-500',
  critical: 'bg-red-500',
  info: 'bg-sky-500',
  neutral: 'bg-surface-400',
  primary: 'bg-primary-500',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-0.5 gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full font-medium',
      tones[tone],
      sizes[size],
      className
    )}
    {...props}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotTones[tone])} aria-hidden />}
    {children}
  </span>
);
