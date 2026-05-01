import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { patientsService } from '../../lib/services';
import { Patient, Appointment, Invoice } from '../../types';
import { Search, UserPlus, Pencil, Trash2, Phone, Mail, Loader2, MessageCircle, CalendarPlus, User, Archive, CheckCircle, Undo2 } from 'lucide-react';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientDashboard } from './components/PatientDashboard';
import { AppointmentModal } from '../appointments/AppointmentModal';
import { useLanguage } from '../language/LanguageContext';
import { cn, formatDate } from '../../lib/utils';

const PAGE_SIZE = 24;

export const PatientsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalArchived, setTotalArchived] = useState(0);

  // New State for Archive View
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | undefined>(undefined);

  // Debounce the search input -> server query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to first page whenever search/view changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, viewMode]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        viewMode === 'active'
          ? patientsService.list({
              page,
              pageSize: PAGE_SIZE,
              search: debouncedSearch || undefined,
              filters: { status: 'active' },
            })
          : patientsService.list({
              page: 0,
              pageSize: 1,
              filters: { status: 'active' },
            }),
        viewMode === 'archived'
          ? patientsService.list({
              page,
              pageSize: PAGE_SIZE,
              search: debouncedSearch || undefined,
              filters: { status: 'archived' },
            })
          : patientsService.list({
              page: 0,
              pageSize: 1,
              filters: { status: 'archived' },
            }),
      ]);
      setPatients(viewMode === 'active' ? activeRes.data : archivedRes.data);
      setTotalActive(activeRes.total);
      setTotalArchived(archivedRes.total);
    } catch (e) {
      console.error('Failed to load patients', e);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, page, debouncedSearch]);

  const refreshData = useCallback(async () => {
    try {
      const [appts, invs] = await Promise.all([
        api.appointments.list(),
        api.invoices.list(),
      ]);
      setAppointments(appts);
      setInvoices(invs);
    } catch (e) {
      console.error('Failed to load appointments/invoices', e);
    }
    await fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    // Load auxiliary data once.
    api.appointments.list().then(setAppointments).catch(console.error);
    api.invoices.list().then(setInvoices).catch(console.error);
  }, []);

  // Server-side filtering already applied; use the result as-is.
  const filteredPatients = useMemo(() => patients, [patients]);

  const activeCount = totalActive;
  const archivedCount = totalArchived;
  const totalPages = Math.max(
    1,
    Math.ceil((viewMode === 'active' ? totalActive : totalArchived) / PAGE_SIZE),
  );

  const handleSavePatient = async (patient: Patient) => {
    setIsLoading(true);
    try {
        if (editingPatient) {
            await api.patients.update(patient);
        } else {
            await api.patients.create(patient);
        }
        await refreshData();
        if (viewingPatient && viewingPatient.id === patient.id) {
            setViewingPatient(patient);
        }
    } catch (e) {
        alert("Failed to save patient");
    } finally {
        setIsLoading(false);
    }
  };

  const handleArchivePatient = async (patient: Patient, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to archive this patient?')) {
          setIsLoading(true);
          try {
              await api.patients.update({ ...patient, status: 'archived' });
              await refreshData();
          } catch (e) {
              alert("Failed to archive patient");
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleRestorePatient = async (patient: Patient, e: React.MouseEvent) => {
      e.stopPropagation();
      setIsLoading(true);
      try {
          await api.patients.update({ ...patient, status: 'active' });
          await refreshData();
      } catch (e) {
          alert("Failed to restore patient");
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeletePatient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this patient permanently? This action cannot be undone.')) {
      setIsLoading(true);
      await api.patients.delete(id);
      await refreshData();
      if (viewingPatient?.id === id) setViewingPatient(null);
    }
  };

  const handleNewAppointment = (patient: Patient, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setEditingAppt({
          id: '',
          patientId: patient.id,
          patientName: patient.name,
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString()
      });
      setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async (data: Partial<Appointment>, appointmentsToCancel: string[] = []) => {
    setIsLoading(true);
    try {
        await api.appointments.save(data, appointmentsToCancel);
        await refreshData();
        setIsAppointmentModalOpen(false);
    } catch (e) {
        alert("Failed to save appointment");
    } finally {
        setIsLoading(false);
    }
  };

  const openNewPatient = () => {
    setEditingPatient(undefined);
    setIsFormOpen(true);
  };

  const openEditPatient = (patient: Patient, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getLastVisit = (patientId: string) => {
      const patientAppts = appointments
        .filter(a => a.patientId === patientId && new Date(a.start) < new Date())
        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
      return patientAppts.length > 0 ? patientAppts[0].start : null;
  };

  return (
    <>
      {viewingPatient ? (
          <PatientDashboard
            patient={viewingPatient}
            allPatients={patients}
            onBack={() => { setViewingPatient(null); refreshData(); }}
            onSwitchPatient={(p) => setViewingPatient(p)}
            onEdit={(p) => openEditPatient(p)}
            onPatientUpdate={(updated) => {
                setViewingPatient(updated);
                setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
            }}
            onNewAppointment={(p) => handleNewAppointment(p)}
            onDataUpdate={refreshData}
            appointments={appointments}
            invoices={invoices}
          />
      ) : (
        <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
          <Topbar title={t('patientDirectory')}>
            {isLoading && <span className="text-xs text-surface-400 flex items-center animate-pulse"><Loader2 className="w-3 h-3 animate-spin mr-1"/> {t('updating')}</span>}
          </Topbar>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                
                {/* Header & Tabs */}
                <div className="flex flex-col gap-4 bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">{t('patients')}</h2>
                            <div className="text-sm text-surface-500 mt-1">Manage your patient records</div>
                        </div>
                        
                        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('active')}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                                    viewMode === 'active' 
                                        ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm" 
                                        : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-300"
                                )}
                            >
                                <CheckCircle size={16} />
                                Active <span className="ml-1 bg-surface-200 dark:bg-surface-900 px-1.5 rounded text-xs text-surface-600 dark:text-surface-400">{activeCount}</span>
                            </button>
                            <button
                                onClick={() => setViewMode('archived')}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                                    viewMode === 'archived' 
                                        ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" 
                                        : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-300"
                                )}
                            >
                                <Archive size={16} />
                                Archived <span className="ml-1 bg-surface-200 dark:bg-surface-900 px-1.5 rounded text-xs text-surface-600 dark:text-surface-400">{archivedCount}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                            <input 
                                type="text"
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50 dark:bg-surface-800 transition-all"
                                placeholder={t('searchPatientsPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                                >
                                    <div className="bg-surface-200 dark:bg-surface-700 rounded-full p-0.5">
                                        <span className="sr-only">Clear</span>
                                        <span className="flex items-center justify-center font-bold text-[10px] w-4 h-4">✕</span>
                                    </div>
                                </button>
                            )}
                        </div>
                        {viewMode === 'active' && (
                            <Button onClick={openNewPatient} className="gap-2 shadow-lg shadow-primary-200 dark:shadow-none whitespace-nowrap">
                                <UserPlus size={18} />
                                {t('addPatient')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading && patients.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : filteredPatients.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                        {filteredPatients.map(patient => {
                            const lastVisit = getLastVisit(patient.id);
                            const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            const isArchived = patient.status === 'archived';
                            
                            return (
                                <div 
                                    key={patient.id}
                                    onClick={() => setViewingPatient(patient)}
                                    className={cn(
                                        "group bg-white dark:bg-surface-900 rounded-2xl border p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden",
                                        isArchived 
                                            ? "border-surface-200 dark:border-surface-800 opacity-80 grayscale hover:grayscale-0" 
                                            : "border-surface-200 dark:border-surface-800"
                                    )}
                                >
                                    {/* Status Strip */}
                                    <div className={cn(
                                        "absolute top-0 left-0 w-1 h-full transition-colors",
                                        isArchived ? "bg-surface-400" : "bg-primary-500"
                                    )} />

                                    <div>
                                        <div className="flex justify-between items-start mb-3 pl-2">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner border border-white dark:border-surface-800 overflow-hidden",
                                                isArchived 
                                                    ? "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                                                    : "bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/10 text-primary-600 dark:text-primary-400"
                                            )}>
                                                {patient.profilePicture ? (
                                                    <img src={patient.profilePicture} alt={patient.name} className="w-full h-full object-cover" />
                                                ) : initials}
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={(e) => openEditPatient(patient, e)}
                                                    className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title={t('editPatient')}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pl-2 mb-4">
                                            <h3 className="font-bold text-lg text-surface-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                                                {patient.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {isArchived && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border bg-surface-100 text-surface-500 border-surface-200 dark:bg-surface-800 dark:border-surface-700">
                                                        Archived
                                                    </span>
                                                )}
                                                {lastVisit ? (
                                                    <span className="text-[10px] text-surface-400">
                                                        Last: {formatDate(new Date(lastVisit), language)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-surface-400 italic">No visits yet</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 pl-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                                <Phone size={14} className="text-surface-400" />
                                                <span>{patient.phone}</span>
                                            </div>
                                            {patient.email && (
                                                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                                    <Mail size={14} className="text-surface-400" />
                                                    <span className="truncate">{patient.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions Footer */}
                                    <div className="border-t border-surface-100 dark:border-surface-800 pt-3 mt-auto pl-2 flex gap-2">
                                        {isArchived ? (
                                            <>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="flex-1 text-xs h-8 bg-surface-50 hover:bg-surface-100 dark:bg-surface-800 border border-surface-200"
                                                    onClick={(e) => handleRestorePatient(patient, e)}
                                                >
                                                    <Undo2 size={14} className="mr-1.5" /> Restore
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 ml-auto"
                                                    onClick={(e) => handleDeletePatient(patient.id, e)}
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="flex-1 text-xs h-8 bg-surface-50 hover:bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
                                                    onClick={(e) => handleNewAppointment(patient, e)}
                                                >
                                                    <CalendarPlus size={14} className="mr-1.5 text-primary-500" /> Book
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
                                                    onClick={(e) => openWhatsApp(e, patient.phone)}
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 border border-transparent hover:border-surface-200 ml-auto"
                                                    onClick={(e) => handleArchivePatient(patient, e)}
                                                    title="Archive"
                                                >
                                                    <Archive size={14} />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                {/* Pagination */}
                {filteredPatients.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 pb-6">
                        <span className="text-sm text-surface-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0 || isLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {filteredPatients.length === 0 && !isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
                            {viewMode === 'archived' ? <Archive size={48} className="text-surface-300"/> : <User size={48} className="text-surface-300" />}
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{t('noPatientsFound')}</h3>
                        <p className="text-surface-500 max-w-sm mb-6">
                            {viewMode === 'archived' ? "No archived patients found." : `We couldn't find any active patients matching "${searchQuery}".`}
                        </p>
                        {viewMode === 'active' && (
                            <Button onClick={openNewPatient} variant="outline">
                                {t('addPatient')}
                            </Button>
                        )}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSavePatient}
        initialData={editingPatient}
      />

      {isAppointmentModalOpen && (
        <AppointmentModal
            isOpen={isAppointmentModalOpen}
            onClose={() => setIsAppointmentModalOpen(false)}
            onSubmit={handleSaveAppointment}
            initialAppointment={editingAppt}
            existingAppointments={appointments}
        />
      )}
    </>
  );
};