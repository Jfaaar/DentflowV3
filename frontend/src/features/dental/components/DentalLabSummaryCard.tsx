// Dashboard widget: a quick read on the dental lab-case board. Shows on the
// clinic dashboard only when the primary specialty is dental (its layout
// profile's dashboardPreset === 'dental'). Links through to the full board.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/shared/constants/routes';
import { useListLabCasesQuery } from '../api/dentalLabApi';

export const DentalLabSummaryCard: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useListLabCasesQuery({ pageSize: 500 });

  const stats = useMemo(() => {
    const rows = data?.data ?? [];
    const open = rows.filter((c) => c.status === 'sent' || c.status === 'in_progress');
    const now = new Date();
    let overdue = 0;
    let dueThisWeek = 0;
    for (const c of open) {
      if (!c.dueDate) continue;
      const days = Math.ceil((new Date(c.dueDate).getTime() - now.getTime()) / 86_400_000);
      if (days < 0) overdue += 1;
      else if (days <= 7) dueThisWeek += 1;
    }
    return {
      total: rows.length,
      open: open.length,
      inProgress: rows.filter((c) => c.status === 'in_progress').length,
      overdue,
      dueThisWeek,
    };
  }, [data]);

  return (
    <Card noPadding className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
        <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <FlaskConical size={18} className="text-primary-600 dark:text-primary-300" />
          {t('labCases', 'Lab cases')}
        </h3>
        <Link to={ROUTES.app.dentalLabCases} className="text-sm text-primary-600 dark:text-primary-300 hover:underline flex items-center gap-1">
          {t('viewAll', 'View all')}<ArrowRight size={14} />
        </Link>
      </div>
      {isLoading ? (
        <div className="p-6 flex items-center text-surface-500 text-sm"><Loader2 size={16} className="animate-spin mr-2" />{t('loading', 'Loading…')}</div>
      ) : stats.total === 0 ? (
        <div className="p-6 text-sm text-surface-500">{t('labCasesEmpty', 'No lab cases yet.')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-surface-100 dark:divide-surface-800">
          <Stat label={t('labCasesOpen', 'Open')} value={stats.open} />
          <Stat label={t('labCaseStatus_in_progress', 'In progress')} value={stats.inProgress} />
          <Stat label={t('labCasesDueWeek', 'Due ≤7 days')} value={stats.dueThisWeek} tone={stats.dueThisWeek > 0 ? 'amber' : undefined} />
          <Stat label={t('labCasesOverdue', 'Overdue')} value={stats.overdue} tone={stats.overdue > 0 ? 'red' : undefined} icon={stats.overdue > 0 ? <AlertTriangle size={14} /> : undefined} />
        </div>
      )}
    </Card>
  );
};

const Stat: React.FC<{ label: string; value: number; tone?: 'amber' | 'red'; icon?: React.ReactNode }> = ({ label, value, tone, icon }) => (
  <div className="px-5 py-4">
    <div className={`text-2xl font-bold flex items-center gap-1.5 ${tone === 'red' ? 'text-red-600 dark:text-red-400' : tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-surface-900 dark:text-white'}`}>
      {icon}{value}
    </div>
    <div className="text-xs text-surface-500 mt-0.5">{label}</div>
  </div>
);
