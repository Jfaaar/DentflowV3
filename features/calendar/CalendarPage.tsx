import React, { useState, useMemo, useEffect } from 'react';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { AppointmentModal } from '../appointments/AppointmentModal';
import { CanceledAppointmentsModal } from './components/CanceledAppointmentsModal';
import { PatientDirectoryModal } from '../patients/PatientDirectoryModal';
import { PatientDetailsModal } from '../patients/components/PatientDetailsModal';
import { PatientFormModal } from '../patients/components/PatientFormModal';
import { Appointment, CalendarViewMode, Patient, Invoice } from '../../types';
import { addDate } from './utils/dateUtils';
import { isSameDay } from '../../lib/utils';
import { Topbar } from '../../components/layout/Topbar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAppointments } from '../appointments/hooks/useAppointments';
import { api } from '../../lib/api';

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Custom Hook
  const { appointments, isLoading, saveAppointment, restoreAppointment } = useAppointments();
  const [isSaving, setIsSaving] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCanceledLogOpen, setIsCanceledLogOpen] = useState(false);
  const [isPatientDirectoryOpen, setIsPatientDirectoryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | undefined>(undefined);

  // Patient Profile & Edit States
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientFormInitData, setPatientFormInitData] = useState<Patient | undefined>(undefined);

  // Alert State
  const [alertMessage, setAlertMessage] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    // Fetch invoices when component mounts to support profile view
    api.invoices.list().then(setInvoices).catch(console.error);
  }, []);

  const activeAppointments = useMemo(() => {
    return appointments.filter(a => a.status !== 'canceled');
  }, [appointments]);

  const canceledAppointments = useMemo(() => {
    return appointments.filter(a => a.status === 'canceled');
  }, [appointments]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;
    if (viewMode === 'month') {
      setCurrentDate(addDate(currentDate, amount, 'month'));
    } else if (viewMode === 'week') {
      setCurrentDate(addDate(currentDate, amount * 7, 'day'));
    } else {
      setCurrentDate(addDate(currentDate, amount, 'day'));
    }
  };

  const handleSaveAppointmentWrapper = async (data: Partial<Appointment>, appointmentsToCancel: string[] = []) => {
    setIsSaving(true);
    const success = await saveAppointment(data, appointmentsToCancel);
    setIsSaving(false);
    
    if (success) {
        setIsModalOpen(false);
        setEditingAppt(undefined);
    } else {
        setAlertMessage({ title: "Error", message: "Failed to save appointment." });
    }
  };

  const handleRestoreAppointmentWrapper = async (apt: Appointment) => {
    const restoreStart = new Date(apt.start).getTime();
    const restoreEnd = new Date(apt.end).getTime();

    const conflict = activeAppointments.find(existing => {
        const existingStart = new Date(existing.start).getTime();
        const existingEnd = new Date(existing.end).getTime();
        return (restoreStart < existingEnd && restoreEnd > existingStart);
    });

    if (conflict) {
        setAlertMessage({
            title: 'Restoration Failed',
            message: `The time slot is already occupied by ${conflict.patientName} (${conflict.status}).`
        });
        return;
    }

    setIsSaving(true);
    const success = await restoreAppointment(apt.id);
    setIsSaving(false);

    if (!success) {
        setAlertMessage({ title: "Error", message: "Failed to restore appointment." });
    }
  };

  const handleNewAppointment = (date?: Date) => {
    setSelectedDate(date || currentDate);
    setEditingAppt(undefined);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingAppt(apt);
    setIsModalOpen(true);
  };

  // Patient Handlers
  const handleSelectPatientFromDirectory = (patient: Patient) => {
    setViewingPatient(patient);
    setIsPatientDirectoryOpen(false);
  };

  const handleBackToDirectory = () => {
    setViewingPatient(null);
    setIsPatientDirectoryOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientFormInitData(patient);
    setViewingPatient(null); // Close profile to open form
    setIsPatientFormOpen(true);
  };

  const handleSavePatient = async (patient: Patient) => {
    setIsSaving(true);
    try {
        if (patientFormInitData) {
            await api.patients.update(patient);
        } else {
            await api.patients.create(patient);
        }
        setIsPatientFormOpen(false);
        setPatientFormInitData(undefined);
        // Reopen directory to show updated list
        setIsPatientDirectoryOpen(true);
    } catch (e) {
        setAlertMessage({ title: "Error", message: "Failed to save patient." });
    } finally {
        setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading && appointments.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-surface-400 dark:text-surface-500">
                <Loader2 className="animate-spin mr-2" /> Loading schedule...
            </div>
        );
    }

    switch (viewMode) {
      case 'month':
        return (
          <MonthView 
            currentDate={currentDate} 
            appointments={appointments}
            onDayClick={(date) => {
                setCurrentDate(date);
                setViewMode('day');
            }} 
          />
        );
      case 'week':
        return (
            <WeekView 
                currentDate={currentDate}
                appointments={activeAppointments} 
                onSlotClick={handleNewAppointment}
                onEditAppointment={handleEditAppointment}
            />
        );
      case 'day':
        return (
          <DayView 
            date={currentDate} 
            appointments={activeAppointments.filter(a => isSameDay(new Date(a.start), currentDate))} 
            onEditAppointment={handleEditAppointment}
            onSlotClick={(timeStr) => handleNewAppointment(new Date(timeStr))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Schedule">
        {isSaving && <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center animate-pulse"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Saving...</span>}
      </Topbar>
      
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onPrev={() => handleNavigate('prev')}
            onNext={() => handleNavigate('next')}
            onToday={() => setCurrentDate(new Date())}
            onNewAppointment={() => handleNewAppointment()}
            onShowCanceled={() => setIsCanceledLogOpen(true)}
            onShowPatients={() => setIsPatientDirectoryOpen(true)}
        />
        
        <div className="flex-1 overflow-hidden">
            {renderContent()}
        </div>
      </div>

      {isModalOpen && (
        <AppointmentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSaveAppointmentWrapper}
            initialDate={selectedDate || new Date()}
            initialAppointment={editingAppt}
            existingAppointments={activeAppointments}
        />
      )}

      <CanceledAppointmentsModal
        isOpen={isCanceledLogOpen}
        onClose={() => setIsCanceledLogOpen(false)}
        canceledAppointments={canceledAppointments}
        onRestore={handleRestoreAppointmentWrapper}
      />

      <PatientDirectoryModal
        isOpen={isPatientDirectoryOpen}
        onClose={() => setIsPatientDirectoryOpen(false)}
        onSelect={handleSelectPatientFromDirectory}
        title="Patient Directory"
      />

      <PatientDetailsModal
        isOpen={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        patient={viewingPatient}
        appointments={appointments}
        invoices={invoices}
        onEdit={handleEditPatient}
        onEditAppointment={handleEditAppointment}
        onBack={handleBackToDirectory}
      />

      <PatientFormModal
        isOpen={isPatientFormOpen}
        onClose={() => setIsPatientFormOpen(false)}
        onSubmit={handleSavePatient}
        initialData={patientFormInitData}
      />

      <Modal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title={alertMessage?.title || 'Alert'}
        maxWidth="sm"
      >
         <div className="flex flex-col items-center text-center p-2 dark:text-white">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <AlertCircle size={28} />
            </div>
            <p className="text-surface-600 dark:text-surface-300 mb-6 whitespace-pre-line">
                {alertMessage?.message}
            </p>
            <Button onClick={() => setAlertMessage(null)} className="w-full">
                Okay
            </Button>
         </div>
      </Modal>
    </div>
  );
};