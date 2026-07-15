import React from 'react';
import { cn } from '../../lib/utils';
import { BRAND } from '../../lib/brand';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  monochrome?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { mark: 22, text: 'text-base' },
  md: { mark: 30, text: 'text-lg' },
  lg: { mark: 40, text: 'text-2xl' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  monochrome = false,
  className,
}) => {
  const { mark, text } = sizeMap[size];
  const gradientId = React.useId();

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-xl shadow-glow',
          monochrome
            ? 'bg-surface-900 dark:bg-white'
            : 'bg-gradient-to-br from-primary-500 to-primary-700'
        )}
        style={{ width: mark + 10, height: mark + 10 }}
        aria-hidden
      >
        <svg
          width={mark}
          height={mark}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#a7f3d0" />
            </linearGradient>
          </defs>
          {/* Soft cross / plus */}
          <path
            d="M14 6h4v8h8v4h-8v8h-4v-8H6v-4h8V6z"
            fill={monochrome ? 'currentColor' : `url(#${gradientId})`}
            opacity={monochrome ? 1 : 0.18}
          />
          {/* Pulse line */}
          <path
            d="M3 16h5l2.5-5 3 10 3-7 2.5 4H29"
            stroke={monochrome ? 'currentColor' : `url(#${gradientId})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      {showWordmark && (
        <span
          className={cn(
            'font-display font-bold tracking-tight whitespace-nowrap',
            text,
            monochrome
              ? 'text-surface-900 dark:text-white'
              : 'bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 dark:from-primary-300 dark:via-primary-200 dark:to-accent-300 bg-clip-text text-transparent'
          )}
        >
          {BRAND.NAME}
        </span>
      )}
    </div>
  );
};
