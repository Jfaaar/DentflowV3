import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ActionChipProps {
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'gradient' | 'ghost';
  children: React.ReactNode;
}

export const ActionChip: React.FC<ActionChipProps> = ({
  icon: Icon,
  onClick,
  variant = 'gradient',
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]',
        variant === 'gradient'
          ? 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white shadow-glow hover:shadow-elevated'
          : 'bg-white/60 dark:bg-surface-900/40 backdrop-blur text-surface-700 dark:text-surface-200 border border-surface-200/70 dark:border-surface-700/70 hover:bg-white dark:hover:bg-surface-800'
      )}
    >
      <Icon size={16} />
      {children}
    </button>
  );
};
