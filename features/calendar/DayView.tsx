import React from 'react';
import { Appointment } from '../../types';
import { cn } from '../../lib/utils';

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  onEditAppointment: (apt: Appointment) => void;
  onSlotClick: (time: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({ date, appointments, onEditAppointment, onSlotClick }) => {
  const startHour = 8;
  const endHour = 18;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const getPosition = (timeStr: string) => {
    const date = new Date(timeStr);
    const h = date.getHours();
    const m = date.getMinutes();
    if (h < startHour || h > endHour) return null;
    
    // Calculate percentage from top
    const totalMinutes = (endHour - startHour) * 60;
    const minutesFromStart = (h - startHour) * 60 + m;
    return (minutesFromStart / totalMinutes) * 100;
  };

  const getDurationHeight = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffMins = (e.getTime() - s.getTime()) / 60000;
    const totalMinutes = (endHour - startHour) * 60;
    return (diffMins / totalMinutes) * 100;
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      <div className="flex-1 relative overflow-y-auto">
        {/* Time Grid */}
        <div className="absolute inset-0 flex flex-col">
          {hours.map(hour => (
            <div key={hour} className="flex-1 border-b border-surface-100 flex min-h-[60px]">
              <div className="w-16 flex-shrink-0 border-r border-surface-100 text-xs text-surface-500 p-2 text-right">
                {hour}:00
              </div>
              <div 
                className="flex-1 cursor-pointer hover:bg-surface-50"
                onClick={() => {
                   const d = new Date(date);
                   d.setHours(hour, 0, 0, 0);
                   onSlotClick(d.toISOString());
                }}
              />
            </div>
          ))}
        </div>

        {/* Appointments */}
        <div className="absolute inset-0 ml-16 pointer-events-none">
            {appointments.map(apt => {
                const top = getPosition(apt.start);
                const height = getDurationHeight(apt.start, apt.end);

                if (top === null) return null;

                const statusColors = {
                    confirmed: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:z-20',
                    pending: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200 hover:z-20',
                    canceled: 'bg-red-50 border-red-200 text-red-800 opacity-60 grayscale hover:grayscale-0 hover:z-10'
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
                            "absolute inset-x-2 rounded-md border p-2 text-xs cursor-pointer pointer-events-auto transition-all flex flex-col overflow-hidden shadow-sm",
                            statusColors[apt.status]
                        )}
                    >
                        <div className="flex justify-between items-start font-bold">
                            <span>{apt.patientName}</span>
                        </div>
                        <div className="mt-0.5 opacity-90">
                            {new Date(apt.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(apt.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                         {apt.observation && <div className="mt-1 truncate opacity-75 italic">{apt.observation}</div>}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};