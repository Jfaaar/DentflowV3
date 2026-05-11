import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Sparkline } from './Sparkline';

export type KpiTone = 'vital' | 'info' | 'primary' | 'alert' | 'critical';

interface KpiCardProps {
  tone?: KpiTone;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  trend?: number; // -100..+100, percentage
  sparkline?: number[];
  onClick?: () => void;
}

const toneClasses: Record<
  KpiTone,
  {
    rail: string;
    iconBg: string;
    iconText: string;
    accentText: string;
    cardBg: string;
    sparkText: string;
  }
> = {
  vital: {
    rail: 'bg-gradient-to-b from-accent-400 to-accent-600',
    iconBg: 'bg-accent-100 dark:bg-accent-900/30',
    iconText: 'text-accent-600 dark:text-accent-300',
    accentText: 'text-accent-600 dark:text-accent-300',
    cardBg: 'from-white to-accent-50/40 dark:from-surface-800 dark:to-accent-900/10',
    sparkText: 'text-accent-500',
  },
  info: {
    rail: 'bg-gradient-to-b from-sky-400 to-sky-600',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    iconText: 'text-sky-600 dark:text-sky-300',
    accentText: 'text-sky-600 dark:text-sky-300',
    cardBg: 'from-white to-sky-50/40 dark:from-surface-800 dark:to-sky-900/10',
    sparkText: 'text-sky-500',
  },
  primary: {
    rail: 'bg-gradient-to-b from-primary-400 to-primary-600',
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    iconText: 'text-primary-600 dark:text-primary-300',
    accentText: 'text-primary-600 dark:text-primary-300',
    cardBg: 'from-white to-primary-50/40 dark:from-surface-800 dark:to-primary-900/10',
    sparkText: 'text-primary-500',
  },
  alert: {
    rail: 'bg-gradient-to-b from-amber-400 to-amber-600',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconText: 'text-amber-600 dark:text-amber-300',
    accentText: 'text-amber-600 dark:text-amber-300',
    cardBg: 'from-white to-amber-50/40 dark:from-surface-800 dark:to-amber-900/10',
    sparkText: 'text-amber-500',
  },
  critical: {
    rail: 'bg-gradient-to-b from-red-400 to-red-600',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconText: 'text-red-600 dark:text-red-300',
    accentText: 'text-red-600 dark:text-red-300',
    cardBg: 'from-white to-red-50/40 dark:from-surface-800 dark:to-red-900/10',
    sparkText: 'text-red-500',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  tone = 'primary',
  icon: Icon,
  label,
  value,
  caption,
  trend,
  sparkline,
  onClick,
}) => {
  const c = toneClasses[tone];
  const TrendIcon =
    trend === undefined ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend === undefined
      ? 'text-surface-400'
      : trend > 0
        ? 'text-accent-600 dark:text-accent-300'
        : trend < 0
          ? 'text-red-500 dark:text-red-400'
          : 'text-surface-400';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-surface-200/60 dark:border-surface-700/60 bg-gradient-to-br p-5 shadow-soft transition-all duration-200',
        c.cardBg,
        onClick && 'cursor-pointer hover:shadow-elevated hover:-translate-y-0.5'
      )}
    >
      <span className={cn('absolute inset-y-3 start-0 w-[3px] rounded-e', c.rail)} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-surface-500 dark:text-surface-400">
            {label}
          </p>
          <h3 className="mt-1.5 font-display text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            {value}
          </h3>
          {caption && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend !== undefined && (
                <span className={cn('inline-flex items-center gap-0.5 font-medium', trendColor)}>
                  <TrendIcon size={12} />
                  {Math.abs(trend)}%
                </span>
              )}
              <span className="text-surface-500 dark:text-surface-400 truncate">{caption}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={cn('p-2.5 rounded-xl', c.iconBg, c.iconText)}>
            <Icon size={22} />
          </div>
          {sparkline && sparkline.length > 0 && (
            <div className={c.sparkText}>
              <Sparkline points={sparkline} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
