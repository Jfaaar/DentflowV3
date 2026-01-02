import React from 'react';
import { Appointment } from '../../../types';
import { cn, isSameDay } from '../../../lib/utils';
import { getWeekDays, isToday } from '../utils/dateUtils';
import { Plus } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSlotClick: (date: Date) => void;
  onEditAppointment: (apt: Appointment) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, appointments, onSlotClick, onEditAppointment }) => {
  const weekDays = getWeekDays(currentDate);
  const startHour = 8;
  const endHour = 18;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  // Helper to position items
  const getPosition = (timeStr: string) => {
    const d = new Date(timeStr);
    const h = d.getHours();
    const m = d.getMinutes();
    if (h < startHour || h > endHour) return null;
    const totalMinutes = (endHour - startHour + 1) * 60;
    const minutesFromStart = (h - startHour) * 60 + m;
    return (minutesFromStart / totalMinutes) * 100;
  };

  const getHeight = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffMins = (e.getTime() - s.getTime()) / 60000;
    const totalMinutes = (endHour - startHour + 1) * 60;
    return (diffMins / totalMinutes) * 100;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. Header - Fixed at the top (Flex Sibling), ensuring it never overlaps content */}
      <div className="flex-none border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 z-20">
        <div className="flex divide-x divide-surface-200 dark:divide-surface-800">
            {/* Spacer for Time Labels */}
            <div className="w-16 flex-shrink-0 bg-surface-50/50 dark:bg-surface-900/50" />
            
            {/* Date Headers */}
            {weekDays.map(date => {
                const isCurrent = isToday(date);
                return (
                    <div key={date.toString()} className="flex-1 py-3 text-center min-w-[100px]">
                        <div className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase mb-1">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors",
                            isCurrent ? "bg-primary-600 text-white shadow-md" : "text-surface-900 dark:text-white"
                        )}>
                            {date.getDate()}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* 2. Content Body - Fits remaining space exactly */}
      <div className="flex-1 relative min-h-0 overflow-x-auto custom-scrollbar bg-white dark:bg-surface-900">
         {/* Container to ensure min-width on mobile but fit-height on desktop */}
         <div className="flex h-full min-w-[800px] mt-3">
            
            {/* Time Labels Column */}
            <div className="w-16 flex-shrink-0 border-r border-t border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30 flex flex-col">
                {hours.map(hour => (
                <div key={hour} className="flex-1 border-b border-surface-100 dark:border-surface-800 text-xs text-surface-400 dark:text-surface-500 relative">
                    <span className="absolute -top-2 right-2 px-1 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm rounded">
                    {hour}:00
                    </span>
                </div>
                ))}
            </div>

            {/* Days Columns */}
            {weekDays.map((date) => {
                const dayAppointments = appointments.filter(apt => isSameDay(new Date(apt.start), date));

                return (
                    <div key={date.toString()} className="flex-1 relative border-r border-t border-surface-100 dark:border-surface-800 last:border-r-0 min-w-[100px]">
                        
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex flex-col">
                            {hours.map((hour) => (
                                <div 
                                    key={hour} 
                                    className="flex-1 border-b border-surface-100 dark:border-surface-800 flex flex-col relative"
                                >
                                    {/* Top 30m Slot */}
                                    <div 
                                        className="flex-1 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors group/slot flex items-center justify-center"
                                        onClick={() => {
                                            const d = new Date(date);
                                            d.setHours(hour, 0, 0, 0);
                                            onSlotClick(d);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 text-primary-500 dark:text-primary-400 opacity-0 group-hover/slot:opacity-100 transition-all scale-75 group-hover/slot:scale-100" />
                                    </div>

                                    {/* 30m Divider */}
                                    <div className="border-t border-dashed border-surface-100/50 dark:border-surface-800/50 pointer-events-none" />

                                    {/* Bottom 30m Slot */}
                                    <div 
                                        className="flex-1 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors group/slot flex items-center justify-center"
                                        onClick={() => {
                                            const d = new Date(date);
                                            d.setHours(hour, 30, 0, 0);
                                            onSlotClick(d);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 text-primary-500 dark:text-primary-400 opacity-0 group-hover/slot:opacity-100 transition-all scale-75 group-hover/slot:scale-100" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Appointment Cards */}
                        {dayAppointments.map(apt => {
                            const top = getPosition(apt.start);
                            const height = getHeight(apt.start, apt.end);
                            if (top === null) return null;

                            const statusStyles = {
                                confirmed: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
                                pending: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
                                completed: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
                                canceled: 'bg-red-50 text-red-800 border-red-100 opacity-60 dark:bg-red-900/20 dark:text-red-400'
                            };

                            return (
                                <div
                                    key={apt.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditAppointment(apt);
                                    }}
                                    style={{ top: `${top}%`, height: `${height}%` }}
                                    className={cn(
                                        "absolute inset-x-1 rounded-lg border p-1 text-[10px] leading-tight cursor-pointer hover:z-20 transition-all shadow-sm flex flex-col overflow-hidden",
                                        statusStyles[apt.status]
                                    )}
                                >
                                    <div className="font-bold truncate">{apt.patientName}</div>
                                    <div className="opacity-80 truncate hidden sm:block">
                                        {new Date(apt.start).getHours()}:{new Date(apt.start).getMinutes().toString().padStart(2, '0')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};