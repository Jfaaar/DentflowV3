import React from 'react';
import { Calendar, UserPlus } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useLanguage } from '../../language/LanguageContext';
import { useGreeting } from '../hooks/useGreeting';
import { Badge } from '../../../components/ui/Badge';
import { ActionChip } from './ActionChip';

interface DashboardHeroProps {
  onNewAppointment?: () => void;
  onRegisterPatient?: () => void;
}

const roleLabel = (
  role: string | undefined,
  t: ReturnType<typeof useLanguage>['t']
): string => {
  switch (role) {
    case 'super_admin':
      return t('roleSuperAdmin');
    case 'clinic_admin':
      return t('roleClinicAdmin');
    case 'doctor':
      return t('roleDoctor');
    case 'assistant':
      return t('roleAssistant');
    default:
      return role || '';
  }
};

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  onNewAppointment,
  onRegisterPatient,
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const greeting = useGreeting();

  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="relative overflow-hidden rounded-2xl border border-surface-200/60 dark:border-surface-800 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/30 dark:via-surface-900 dark:to-accent-900/15 p-6 md:p-8 shadow-soft">
      {/* Decorative blob */}
      <span
        aria-hidden
        className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-primary-200/40 dark:bg-primary-500/10 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-24 -start-12 w-72 h-72 rounded-full bg-accent-200/40 dark:bg-accent-500/10 blur-3xl"
      />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs md:text-sm text-surface-500 dark:text-surface-400 font-medium capitalize">
            {today}
          </p>
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            {greeting}
            {user?.name && (
              <>
                ,{' '}
                <span className="bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 dark:from-primary-300 dark:via-primary-200 dark:to-accent-300 bg-clip-text text-transparent">
                  {user.name}
                </span>
              </>
            )}
          </h2>
          {user?.role && (
            <Badge tone="vital" dot className="mt-3">
              {roleLabel(user.role, t)}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {onNewAppointment && (
            <ActionChip icon={Calendar} onClick={onNewAppointment}>
              {t('newAppointment')}
            </ActionChip>
          )}
          {onRegisterPatient && (
            <ActionChip icon={UserPlus} variant="ghost" onClick={onRegisterPatient}>
              {t('registerPatient')}
            </ActionChip>
          )}
        </div>
      </div>
    </section>
  );
};
