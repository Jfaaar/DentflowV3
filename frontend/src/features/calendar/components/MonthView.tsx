import React, { useEffect, useRef } from 'react';
import { Appointment, DaySummary } from '../../../types';
import { cn, isSameDay } from '../../../lib/utils';
import { getMonthDays, isToday } from '../utils/dateUtils';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../language/LanguageContext';

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, appointments, onDayClick }) => {
  const { t, language } = useLanguage();
  const daysInMonth = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = daysInMonth[0].getDay(); 
  const offset = startDay === 0 ? 6 : startDay - 1; 
  const blanks = Array(offset).fill(null);
  
  // Use Intl to get localized week day names
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    // Generate dates for a known week (e.g. 2024-01-01 is Mon)
    const d = new Date(2024, 0, i + 1);
    return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(d);
  });

  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDate]);

  const getDaySummary = (date: Date): DaySummary & { completed: number } => {
    const dayAppts = appointments.filter(a => isSameDay(new Date(a.start), date));
    return {
      date,
      confirmed: dayAppts.filter(a => a.status === 'confirmed').length,
      pending: dayAppts.filter(a => a.status === 'pending').length,
      canceled: dayAppts.filter(a => a.status === 'canceled').length,
      completed: dayAppts.filter(a => a.status === 'completed').length,
      appointments: dayAppts,
    };
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden animate-fade-in">
      {/* Header Row */}
      <div className="grid grid-cols-7 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 shrink-0">
        {weekDays.map(day => (
          <div key={day} className="py-2 md:py-4 text-center text-[10px] md:text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-200 dark:bg-surface-800">
        <div className="grid grid-cols-7 auto-rows-fr gap-[1px] border-b border-surface-200 dark:border-surface-800 min-h-full">
            {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="bg-white/50 dark:bg-surface-900/50 min-h-[6rem] md:min-h-[10rem]" />
            ))}
            
            {daysInMonth.map((date) => {
            const summary = getDaySummary(date);
            const isCurrentDay = isToday(date);
            
            return (
                <div 
                key={date.toString()} 
                ref={isCurrentDay ? todayRef : null}
                onClick={() => onDayClick(date)}
                className={cn(
                    "bg-white dark:bg-surface-900 p-1 md:p-3 min-h-[6rem] md:min-h-[10rem] relative group transition-all duration-200 hover:z-10 hover:shadow-lg cursor-pointer flex flex-col",
                    isCurrentDay 
                        ? "bg-primary-50/30 dark:bg-primary-900/10" 
                        : "hover:bg-primary-50 dark:hover:bg-primary-900/20"
                )}
                >
                <div className="flex justify-between items-start mb-1 md:mb-2">
                    <span className={cn(
                    "text-xs md:text-sm font-medium w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-colors",
                    isCurrentDay 
                        ? "bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-none" 
                        : "text-surface-700 dark:text-surface-300 group-hover:bg-surface-100 dark:group-hover:bg-surface-800"
                    )}>
                    {date.getDate()}
                    </span>
                    
                    <div className="flex md:hidden gap-0.5 mt-1">
                        {summary.completed > 0 && <div className="w-1.5 h-1.5 rounded-full bg-purple-500"/>}
                        {summary.confirmed > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-500"/>}
                        {summary.pending > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"/>}
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {summary.appointments.length > 0 ? (
                    <>
                        <div className="hidden md:flex flex-col gap-1 overflow-y-auto scrollbar-none">
                            {summary.completed > 0 && (
                            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-medium border border-purple-100 dark:border-purple-900/30">
                                <span className="truncate">{t('completed')}</span>
                                <span className="bg-purple-200/50 dark:bg-purple-500/20 px-1.5 rounded-sm ml-1">{summary.completed}</span>
                            </div>
                            )}
                            {summary.confirmed > 0 && (
                            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-medium border border-green-100 dark:border-green-900/30">
                                <span className="truncate">{t('confirmed')}</span>
                                <span className="bg-green-200/50 dark:bg-green-500/20 px-1.5 rounded-sm ml-1">{summary.confirmed}</span>
                            </div>
                            )}
                            {summary.pending > 0 && (
                            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-[10px] font-medium border border-orange-100 dark:border-orange-900/30">
                                <span className="truncate">{t('pending')}</span>
                                <span className="bg-orange-200/50 dark:bg-orange-500/20 px-1.5 rounded-sm ml-1">{summary.pending}</span>
                            </div>
                            )}
                        </div>
                    </>
                    ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="text-surface-300 dark:text-surface-600" size={24} />
                    </div>
                    )}
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};