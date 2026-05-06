import React from 'react';
import { Appointment, DaySummary } from '../../types';
import { cn, isSameDay, getDaysInMonth } from '../../lib/utils';
import { Plus } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, appointments, onDayClick }) => {
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  // Grid alignment (start day of week)
  const startDay = daysInMonth[0].getDay(); // 0 = Sunday
  // Adjust for Monday start if desired, keeping standard Sunday start for now or shifting
  // Let's assume Monday start for SaaS business apps usually
  const offset = startDay === 0 ? 6 : startDay - 1; 
  
  const blanks = Array(offset).fill(null);

  const getDaySummary = (date: Date): DaySummary => {
    const dayAppts = appointments.filter(a => isSameDay(new Date(a.start), date));
    return {
      date,
      confirmed: dayAppts.filter(a => a.status === 'confirmed').length,
      pending: dayAppts.filter(a => a.status === 'pending').length,
      canceled: dayAppts.filter(a => a.status === 'canceled').length,
      appointments: dayAppts,
    };
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-surface-200 bg-surface-50">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-surface-200 gap-[1px]">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="bg-white h-32 md:h-40" />
        ))}
        
        {daysInMonth.map((date) => {
          const summary = getDaySummary(date);
          const isToday = isSameDay(date, new Date());
          const hasConfirmed = summary.confirmed > 0;
          const hasPending = summary.pending > 0;
          const hasCanceled = summary.canceled > 0;
          
          return (
            <div 
              key={date.toString()} 
              onClick={() => onDayClick(date)}
              className={cn(
                "bg-white p-2 h-32 md:h-40 relative group hover:bg-primary-50/30 transition-colors cursor-pointer flex flex-col justify-between",
                isToday && "bg-blue-50/50"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday ? "bg-primary-600 text-white" : "text-surface-700 group-hover:text-primary-700"
                )}>
                  {date.getDate()}
                </span>
                
                {/* Status Dots */}
                <div className="flex gap-1">
                  {hasCanceled && <div className="w-2 h-2 rounded-full bg-red-500 ring-1 ring-white" title="Has Canceled" />}
                  {hasPending && <div className="w-2 h-2 rounded-full bg-orange-500 ring-1 ring-white animate-pulse" title="Has Pending" />}
                </div>
              </div>

              {/* Slot Summary */}
              <div className="space-y-1 mt-2">
                {summary.appointments.length === 0 ? (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center h-full pb-6">
                        <Plus className="text-surface-300" size={20} />
                    </div>
                ) : (
                    <>
                        {/* Logic: Show specific stats if > 2 items, else show pills? 
                            Prompt asks for Confirmed: X, Pending: Y... when > 2 */}
                        
                        {summary.appointments.length > 0 && (
                            <div className="flex flex-col gap-1 text-[10px] font-medium text-surface-600">
                                {hasConfirmed && (
                                    <div className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded flex justify-between">
                                        <span>Confirmed</span>
                                        <span>{summary.confirmed}</span>
                                    </div>
                                )}
                                {hasPending && (
                                    <div className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded flex justify-between border-l-2 border-orange-400">
                                        <span>Pending</span>
                                        <span>{summary.pending}</span>
                                    </div>
                                )}
                                {hasCanceled && (
                                    <div className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded flex justify-between opacity-75">
                                        <span>Canceled</span>
                                        <span>{summary.canceled}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};