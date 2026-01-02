import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Appointment, AppointmentStatus, Patient } from '../../types';
import { cn } from '../../lib/utils';
import { Clock, Calendar as CalendarIcon, User, Phone, Search, X, Lock, FileText, Activity, BookUser, Trash2, AlertTriangle, MessageCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { PatientDirectoryModal } from '../patients/PatientDirectoryModal';
import { useLanguage } from '../../features/language/LanguageContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Appointment>, appointmentsToCancel?: string[]) => void;
  initialDate?: Date;
  initialAppointment?: Appointment;
  existingAppointments: Appointment[];
}

const START_HOUR = 8;
const END_HOUR = 18;

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialAppointment,
  existingAppointments
}) => {
  const { t } = useLanguage();
  // --- State ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [observation, setObservation] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingConflictIds, setPendingConflictIds] = useState<string[] | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  useEffect(() => {
    if (isOpen) {
      api.patients.list().then(setPatients);
    }
  }, [isOpen]);

  // Initialization Logic
  useEffect(() => {
    if (isOpen) {
      setValidationError(null); // Clear errors on open
      if (initialAppointment) {
        // --- Edit Mode ---
        if (patients.length > 0) {
            const foundPatient = patients.find(p => p.id === initialAppointment.patientId);
            if (foundPatient) setSelectedPatient(foundPatient);
            else if (initialAppointment.patientName) {
                 setSelectedPatient({ id: initialAppointment.patientId, name: initialAppointment.patientName, phone: 'Unknown' });
            }
        } else if (initialAppointment.patientName) {
            setSelectedPatient({ id: initialAppointment.patientId, name: initialAppointment.patientName, phone: 'Loading...' });
        }

        setStatus(initialAppointment.status);
        setObservation(initialAppointment.observation || '');
        
        const startObj = new Date(initialAppointment.start);
        const endObj = new Date(initialAppointment.end);
        
        const offset = startObj.getTimezoneOffset();
        const localDate = new Date(startObj.getTime() - (offset * 60 * 1000));
        setSelectedDate(localDate.toISOString().split('T')[0]);
        
        const slots = [];
        let current = new Date(startObj);
        while (current < endObj) {
          const timeStr = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          if (timeSlots.includes(timeStr)) slots.push(timeStr);
          current.setMinutes(current.getMinutes() + 30);
        }
        setSelectedSlots(slots);

      } else {
        // --- New Appointment Mode ---
        // Reset form first
        if (!selectedDate && !initialDate) {
             resetForm();
        }
      }
    }
  }, [isOpen, initialAppointment, patients]);

  // Strict Date Initialization Effect
  useEffect(() => {
    if (isOpen && !initialAppointment && initialDate) {
        resetForm();
        
        const offset = initialDate.getTimezoneOffset(); 
        const localDate = new Date(initialDate.getTime() - (offset*60*1000));
        setSelectedDate(localDate.toISOString().split('T')[0]);
        
        const h = initialDate.getHours();
        const m = initialDate.getMinutes();
        if (h >= START_HOUR && h < END_HOUR) {
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            // Adjust to nearest 30 min slot
            const slotMin = m < 30 ? '00' : '30';
            const adjustedTimeStr = `${h.toString().padStart(2, '0')}:${slotMin}`;
            setSelectedSlots([adjustedTimeStr]);
        }
    }
  }, [isOpen, initialDate, initialAppointment]);

  const resetForm = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setStatus('pending');
    setObservation('');
    setSelectedSlots([]);
    setSelectedDate('');
    setShowCancelConfirm(false);
    setPendingConflictIds(null);
    setShowOverwriteConfirm(false);
    setValidationError(null);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return [];
    const lower = searchQuery.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(lower) || p.phone.includes(lower));
  }, [patients, searchQuery]);

  const checkSlotStatus = (dateStr: string, timeStr: string) => {
    if (!dateStr) return { status: 'free' as const };
    const slotStart = new Date(`${dateStr}T${timeStr}`);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000); 

    const conflict = existingAppointments.find(apt => {
        if (apt.status === 'canceled') return false;
        if (initialAppointment && apt.id === initialAppointment.id) return false;
        const aptStart = new Date(apt.start);
        const aptEnd = new Date(apt.end);
        return (aptStart < slotEnd && aptEnd > slotStart);
    });

    if (!conflict) return { status: 'free' as const };
    return { status: conflict.status, appointment: conflict };
  };

  const toggleSlot = (slot: string) => {
    setValidationError(null);
    const { status: slotStatus } = checkSlotStatus(selectedDate, slot);
    if (slotStatus === 'confirmed' || slotStatus === 'completed') return;
    
    // Logic: If clicking an already selected slot, clear everything to start over
    if (selectedSlots.includes(slot)) {
        setSelectedSlots([]);
        return;
    }

    // Logic: Range Selection
    if (selectedSlots.length > 0) {
        const sorted = [...selectedSlots, slot].sort();
        const startIdx = timeSlots.indexOf(sorted[0]);
        const endIdx = timeSlots.indexOf(sorted[sorted.length - 1]);
        
        // Generate range
        const candidateRange = timeSlots.slice(startIdx, endIdx + 1);
        
        // Check if any confirmed slots are in the way
        const hasConfirmedConflict = candidateRange.some(s => {
            const st = checkSlotStatus(selectedDate, s);
            return st.status === 'confirmed' || st.status === 'completed';
        });

        if (!hasConfirmedConflict) {
            setSelectedSlots(candidateRange);
        }
    } else {
        setSelectedSlots([slot]);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setIsDirectoryOpen(false);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedDate || selectedSlots.length === 0) {
        setValidationError(t('selectDateFirst'));
        return;
    }
    if (!selectedPatient) {
        setValidationError(t('selectPatient'));
        return;
    }

    const sortedSlots = [...selectedSlots].sort();
    const startTime = sortedSlots[0];
    const endTime = sortedSlots[sortedSlots.length - 1];
    
    const start = new Date(`${selectedDate}T${startTime}`);
    const end = new Date(`${selectedDate}T${endTime}`);
    end.setMinutes(end.getMinutes() + 30); // Add 30 mins to last slot

    // Check for pending conflicts in the range
    const conflicts: string[] = [];
    sortedSlots.forEach(slot => {
        const check = checkSlotStatus(selectedDate, slot);
        if (check.status === 'pending' && check.appointment) {
             if (!conflicts.includes(check.appointment.id)) {
                 conflicts.push(check.appointment.id);
             }
        }
    });

    if (conflicts.length > 0) {
        setPendingConflictIds(conflicts);
        setShowOverwriteConfirm(true);
        return;
    }

    submitData(start, end);
  };

  const submitData = (start: Date, end: Date, cancelIds: string[] = []) => {
    if (!selectedPatient) return;

    const appointmentData: Partial<Appointment> = {
      id: initialAppointment?.id,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      start: start.toISOString(),
      end: end.toISOString(),
      status,
      observation
    };
    onSubmit(appointmentData, cancelIds);
    onClose();
  };

  const confirmOverwrite = () => {
    if (!selectedDate || selectedSlots.length === 0 || !selectedPatient) return;
    const sortedSlots = [...selectedSlots].sort();
    const startTime = sortedSlots[0];
    const endTime = sortedSlots[sortedSlots.length - 1];
    const start = new Date(`${selectedDate}T${startTime}`);
    const end = new Date(`${selectedDate}T${endTime}`);
    end.setMinutes(end.getMinutes() + 30);

    submitData(start, end, pendingConflictIds || []);
    setShowOverwriteConfirm(false);
  };

  const handleCancelBooking = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowCancelConfirm(true);
  };

  const confirmCancelBooking = () => {
      if (initialAppointment) {
          onSubmit({ id: initialAppointment.id, status: 'canceled' });
          onClose();
      }
      setShowCancelConfirm(false);
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getStatusColor = (s: AppointmentStatus) => {
      switch(s) {
          case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
          case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'canceled': return 'bg-red-100 text-red-700 border-red-200';
          case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
          default: return 'bg-surface-100 text-surface-700 border-surface-200';
      }
  };

  const statusTheme = useMemo(() => {
    switch (status) {
        case 'confirmed': return { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', ring: 'focus:ring-green-500' };
        case 'pending': return { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', ring: 'focus:ring-orange-500' };
        default: return { bg: 'bg-surface-50 dark:bg-surface-800', border: 'border-surface-200 dark:border-surface-700', text: 'text-surface-700 dark:text-surface-300', ring: 'focus:ring-primary-500' };
    }
  }, [status]);

  // Read-only mode for completed appointments
  const isReadOnly = initialAppointment?.status === 'completed';

  // Time Range Display Calculation
  const timeRangeDisplay = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    const sorted = [...selectedSlots].sort();
    const startStr = sorted[0];
    const endStr = sorted[sorted.length - 1];
    
    // Calculate end time (add 30 mins to last slot)
    const [h, m] = endStr.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(h, m + 30);
    const formattedEnd = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return `${startStr} - ${formattedEnd}`;
  }, [selectedSlots]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialAppointment ? t('editAppointment') : t('newAppointment')} maxWidth="4xl">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 h-[80vh] md:h-auto overflow-y-auto md:overflow-visible p-1">
        
        {/* Left Column: Patient & Details */}
        <div className="flex-1 flex flex-col gap-6">
            
            {/* Section: Patient */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-surface-900 dark:text-white font-semibold border-b border-surface-100 dark:border-surface-700 pb-2">
                    <User size={18} className="text-primary-500" />
                    <h3>{t('patientDetails')}</h3>
                </div>

                <div className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                    {!selectedPatient ? (
                         <div className="flex gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                                <input 
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-900"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    disabled={isReadOnly}
                                />
                                {searchQuery && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                                        {filteredPatients.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => handleSelectPatient(p)}
                                                className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700 cursor-pointer flex items-center justify-between border-b border-surface-100 dark:border-surface-700 last:border-0"
                                            >
                                                <div>
                                                    <div className="font-bold text-surface-900 dark:text-white">{p.name}</div>
                                                    <div className="text-xs text-surface-500">{p.phone}</div>
                                                </div>
                                                <User size={16} className="text-surface-400" />
                                            </div>
                                        ))}
                                        {filteredPatients.length === 0 && (
                                            <div className="p-4 text-center text-sm text-surface-400 italic">
                                                {t('noPatientsFound')}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                             <Button type="button" onClick={() => setIsDirectoryOpen(true)} className="px-3" disabled={isReadOnly} title={t('patientDirectory')}>
                                <BookUser size={20} />
                             </Button>
                         </div>
                    ) : (
                        <div className="flex items-start justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                                    {selectedPatient.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-surface-900 dark:text-white text-lg">{selectedPatient.name}</h4>
                                    <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                                        <span className="flex items-center gap-1"><Phone size={14}/> {selectedPatient.phone}</span>
                                        <button onClick={(e) => openWhatsApp(e, selectedPatient.phone)} className="text-green-500 hover:text-green-600" title="WhatsApp">
                                            <MessageCircle size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {!isReadOnly && (
                                <button onClick={() => setSelectedPatient(null)} className="p-2 text-surface-400 hover:text-red-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Status & Notes */}
            <div className="flex flex-col gap-3 flex-1">
                 <div className="flex items-center gap-2 text-surface-900 dark:text-white font-semibold border-b border-surface-100 dark:border-surface-700 pb-2">
                    <Activity size={18} className={statusTheme.text} />
                    <h3>{t('statusAndNotes')}</h3>
                </div>

                <div className={cn("flex-1 rounded-xl border p-4 flex flex-col gap-4 transition-colors", statusTheme.bg, statusTheme.border)}>
                     {isReadOnly ? (
                         <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg justify-center">
                             <CheckCircle size={20} />
                             {t('appointmentCompleted')}
                         </div>
                     ) : (
                         <div className="grid grid-cols-2 gap-3">
                            {(['confirmed', 'pending'] as const).map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={cn(
                                        "py-2.5 px-4 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2",
                                        status === s 
                                            ? "ring-2 ring-offset-1 dark:ring-offset-surface-900 shadow-sm transform scale-[1.02]" 
                                            : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800",
                                        status === s && s === 'confirmed' ? "bg-green-500 text-white border-green-600 ring-green-500" : "",
                                        status === s && s === 'pending' ? "bg-orange-500 text-white border-orange-600 ring-orange-500" : ""
                                    )}
                                >
                                    {status === s && <CheckCircle size={14} />}
                                    {/* @ts-ignore */}
                                    {t(s)}
                                </button>
                            ))}
                         </div>
                     )}

                     <div className="relative flex-1">
                        <textarea
                            className={cn(
                                "w-full h-full min-h-[100px] p-3 rounded-lg border bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 resize-none text-surface-900 dark:text-white",
                                isReadOnly ? "opacity-75 cursor-not-allowed" : "",
                                statusTheme.border,
                                statusTheme.ring
                            )}
                            placeholder={t('notesPlaceholder')}
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            disabled={isReadOnly}
                        />
                        <FileText size={16} className="absolute bottom-3 right-3 text-surface-300 pointer-events-none" />
                     </div>
                </div>
            </div>

        </div>

        {/* Right Column: Schedule */}
        <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
            <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-700 pb-2">
                <div className="flex items-center gap-2 text-surface-900 dark:text-white font-semibold">
                    <CalendarIcon size={18} className="text-primary-500" />
                    <h3>{t('dateTime')}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-surface-200 dark:bg-surface-700" /> {t('availableSlots')}</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-surface-900/50 dark:bg-white/50" /> {t('locked')}</div>
                </div>
            </div>

            <div className="flex flex-col gap-4 h-full">
                <input 
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlots([]);
                        setValidationError(null);
                    }}
                    disabled={isReadOnly}
                />

                <div className="flex-1 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-800/50 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {!selectedDate ? (
                            <div className="h-full flex flex-col items-center justify-center text-surface-400 dark:text-surface-500 gap-2">
                                <CalendarIcon size={32} className="opacity-20" />
                                <p className="text-sm">{t('selectDateFirst')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 p-2">
                                {timeSlots.map((slot) => {
                                    const { status: slotStatus } = checkSlotStatus(selectedDate, slot);
                                    const isLocked = slotStatus === 'confirmed' || slotStatus === 'completed';
                                    const isPending = slotStatus === 'pending';
                                    const isSelected = selectedSlots.includes(slot);

                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => toggleSlot(slot)}
                                            disabled={isLocked || isReadOnly}
                                            className={cn(
                                                "py-2 rounded-lg text-xs font-semibold transition-all relative border",
                                                isSelected 
                                                    ? "bg-primary-600 text-white border-primary-700 shadow-md transform scale-105 z-10" 
                                                    : isLocked 
                                                        ? "bg-surface-100 dark:bg-surface-800 text-surface-400 border-transparent cursor-not-allowed" 
                                                        : isPending
                                                            ? "bg-white dark:bg-surface-800 text-surface-400 border-orange-200 dark:border-orange-900/50 cursor-not-allowed opacity-60"
                                                            : "bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:shadow-sm",
                                            )}
                                        >
                                            {isLocked && <Lock size={10} className="absolute top-1 right-1 opacity-50" />}
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    {/* Time Selection Footer */}
                    <div className="bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-3 flex justify-between items-center text-xs font-medium text-surface-600 dark:text-surface-400 mt-auto">
                        <span>{selectedSlots.length} {t('slotsCount')}</span>
                        {timeRangeDisplay && (
                            <span className="font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">
                                {timeRangeDisplay}
                            </span>
                        )}
                        <span>{selectedSlots.length * 30} {t('mins')}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Directory Modal */}
        <PatientDirectoryModal
            isOpen={isDirectoryOpen}
            onClose={() => setIsDirectoryOpen(false)}
            onSelect={handleSelectPatient}
        />
      </form>

      {/* Footer Actions */}
      <div className="pt-4 mt-auto border-t border-surface-100 dark:border-surface-700 flex justify-between items-center">
         {initialAppointment && !isReadOnly && initialAppointment.status !== 'canceled' ? (
             <Button type="button" variant="danger" onClick={handleCancelBooking} className="gap-2">
                 <Trash2 size={16} /> {t('cancelBooking')}
             </Button>
         ) : <div></div>}
         
         <div className="flex items-center gap-4">
            {validationError && (
                <div className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg animate-pulse">
                    <AlertTriangle size={14} />
                    {validationError}
                </div>
            )}
            <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose}>{t('close')}</Button>
                {!isReadOnly && (
                    <Button onClick={handleSubmit} className="min-w-[140px]">
                        {initialAppointment ? t('done') : t('saveAppointment')}
                    </Button>
                )}
            </div>
         </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal 
        isOpen={showCancelConfirm} 
        onClose={() => setShowCancelConfirm(false)}
        title={t('cancelConfirmTitle')}
        maxWidth="sm"
      >
        <div className="text-center p-4">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{t('cancelConfirmTitle')}</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
                {t('cancelConfirmMessage')}
            </p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCancelConfirm(false)}>{t('keepIt')}</Button>
                <Button variant="danger" className="flex-1" onClick={confirmCancelBooking}>{t('confirmCancel')}</Button>
            </div>
        </div>
      </Modal>

      {/* Overwrite Confirmation Modal */}
      <Modal 
        isOpen={showOverwriteConfirm} 
        onClose={() => setShowOverwriteConfirm(false)}
        title={t('overwriteTitle')}
        maxWidth="sm"
      >
        <div className="text-center p-4">
             <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 dark:text-orange-400">
                <Activity size={32} />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{t('overwriteTitle')}</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
                {t('overwriteMessage')}
            </p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowOverwriteConfirm(false)}>{t('cancel')}</Button>
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={confirmOverwrite}>{t('overwrite')}</Button>
            </div>
        </div>
      </Modal>
    </Modal>
  );
};
