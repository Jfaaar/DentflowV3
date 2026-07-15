import React from 'react';
import { ChevronLeft, ChevronRight, Plus, History, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CalendarViewMode } from '../../../types';
import { formatMonthYear } from '../../../lib/utils';
import { useLanguage } from '../../../features/language/LanguageContext';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewAppointment: () => void;
  onShowCanceled: () => void;
  onShowPatients: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewAppointment,
  onShowCanceled,
  onShowPatients
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col gap-4 mb-4 md:mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Navigation & Date */}
        <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-sm p-1">
              <button onClick={onPrev} className="p-1.5 md:p-2 hover:bg-surface-50 dark:hover:bg-surface-700 rounded-lg text-surface-600 dark:text-surface-300 transition-colors">
                <ChevronLeft size={20} className="rtl:rotate-180" />
              </button>
              <button onClick={onNext} className="p-1.5 md:p-2 hover:bg-surface-50 dark:hover:bg-surface-700 rounded-lg text-surface-600 dark:text-surface-300 transition-colors">
                <ChevronRight size={20} className="rtl:rotate-180" />
              </button>
            </div>
            
            <Button variant="outline" size="sm" onClick={onToday} className="hidden sm:flex">
              {t('today')}
            </Button>
          </div>
          
          <h2 className="text-lg md:text-xl font-bold text-surface-900 dark:text-white md:min-w-[200px] text-right md:text-left">
            {formatMonthYear(currentDate, language)}
          </h2>
        </div>

        {/* Right: View Switcher & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl border border-surface-200 dark:border-surface-700">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewChange(mode)}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-200/50 dark:hover:bg-surface-700/50'
                }`}
              >
                {/* @ts-ignore */}
                {t(mode)}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-8 w-px bg-surface-300 dark:bg-surface-700 mx-1" />

          <div className="flex items-center gap-2 justify-between sm:justify-end">
             <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={onShowPatients} title={t('patientDirectory')} className="text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                    <Users size={20} />
                </Button>

                <Button variant="ghost" size="icon" onClick={onShowCanceled} title={t('canceledLog')} className="text-surface-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <History size={20} />
                </Button>
             </div>

            <Button onClick={onNewAppointment} className="gap-2 flex-1 sm:flex-none">
                <Plus size={18} />
                <span>{t('newAppointment')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};