
import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Appointment, InventoryItem, Patient, Invoice } from '../../types';
import { formatTime, isSameDay } from '../../lib/utils';
import { 
  CalendarCheck, Clock, CheckCircle, User, Loader2, FileText, 
  AlertOctagon, TrendingUp, Users, Calendar, AlertTriangle, 
  Package, Plus, ChevronRight, Wallet, ArrowRight, Activity
} from 'lucide-react';
import { useLanguage } from '../../features/language/LanguageContext';
import { cn } from '../../lib/utils';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentToValidate, setAppointmentToValidate] = useState<Appointment | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allAppts, allInventory, allPatients, allInvoices] = await Promise.all([
          api.appointments.list(),
          api.inventory.list(),
          api.patients.list(),
          api.invoices.list()
      ]);
      
      setAppointments(allAppts);
      setInventory(allInventory);
      setPatients(allPatients);
      setInvoices(allInvoices);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Appointments Today
      const todayAppts = appointments
        .filter(a => isSameDay(new Date(a.start), today) && a.status !== 'canceled')
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      const nextAppt = todayAppts.find(a => new Date(a.start) > new Date()) || todayAppts[todayAppts.length - 1];

      // Patients
      const activePatients = patients.filter(p => p.status !== 'archived').length;
      const newPatientsMonth = patients.filter(p => p.createdAt && new Date(p.createdAt) >= startOfMonth).length;

      // Financials
      const revenueToday = invoices
        .filter(i => isSameDay(new Date(i.date), today))
        .reduce((sum, i) => sum + i.amount, 0);
      
      const revenueMonth = invoices
        .filter(i => new Date(i.date) >= startOfMonth)
        .reduce((sum, i) => sum + i.amount, 0);

      // Inventory Alerts
      const lowStock = inventory.filter(i => i.stock <= (i.minStock || 0));
      const expiringSoon = inventory.filter(i => {
          if (!i.expiryDate) return false;
          const expiry = new Date(i.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays >= 0;
      });

      return {
          todayAppts,
          nextAppt,
          activePatients,
          newPatientsMonth,
          revenueToday,
          revenueMonth,
          alerts: { lowStock, expiringSoon },
          completionRate: todayAppts.length > 0 
            ? Math.round((todayAppts.filter(a => a.status === 'completed').length / todayAppts.length) * 100) 
            : 0
      };
  }, [appointments, inventory, patients, invoices]);

  const initiateValidate = (apt: Appointment) => {
      setAppointmentToValidate(apt);
  };

  const confirmValidate = async () => {
      if (!appointmentToValidate) return;
      setIsValidating(true);
      try {
        await api.appointments.save({ ...appointmentToValidate, status: 'completed' });
        await fetchData();
        setAppointmentToValidate(null);
      } catch (e) {
        alert("Failed to validate appointment");
      } finally {
        setIsValidating(false);
      }
  };

  if (isLoading) {
      return (
          <div className="h-full flex items-center justify-center bg-surface-50 dark:bg-surface-950">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('dashboard')} />
      
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* 1. High-Level KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <Card className="p-5 flex items-start justify-between border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/50 dark:from-surface-800 dark:to-green-900/10">
                    <div>
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Revenue Today</p>
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {stats.revenueToday.toLocaleString()} <span className="text-sm font-normal text-surface-500">DH</span>
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
                            <TrendingUp size={12} />
                            <span>{stats.revenueMonth.toLocaleString()} DH this month</span>
                        </div>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                        <Wallet size={24} />
                    </div>
                </Card>

                {/* Appointments */}
                <Card className="p-5 flex items-start justify-between border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/50 dark:from-surface-800 dark:to-blue-900/10">
                    <div>
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Appointments</p>
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {stats.todayAppts.length} <span className="text-sm font-normal text-surface-500">Today</span>
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium">
                            <Activity size={12} />
                            <span>{stats.completionRate}% Completed</span>
                        </div>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <CalendarCheck size={24} />
                    </div>
                </Card>

                {/* Patients */}
                <Card className="p-5 flex items-start justify-between border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/50 dark:from-surface-800 dark:to-purple-900/10">
                    <div>
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Active Patients</p>
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {stats.activePatients}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 font-medium">
                            <Plus size={12} />
                            <span>{stats.newPatientsMonth} new this month</span>
                        </div>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                        <Users size={24} />
                    </div>
                </Card>

                {/* Alerts */}
                <Card className={cn(
                    "p-5 flex items-start justify-between border-l-4 bg-gradient-to-br from-white to-orange-50/50 dark:from-surface-800 dark:to-orange-900/10",
                    (stats.alerts.lowStock.length + stats.alerts.expiringSoon.length) > 0 ? "border-l-red-500" : "border-l-surface-300"
                )}>
                    <div>
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Cabinet Alerts</p>
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {stats.alerts.lowStock.length + stats.alerts.expiringSoon.length}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 font-medium">
                            <AlertTriangle size={12} />
                            <span>Action Required</span>
                        </div>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                        <Package size={24} />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2. Left Column: Agenda & Operations (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Today's Agenda */}
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <Calendar className="text-primary-600" />
                                {t('todaysAgenda')}
                            </h3>
                            <span className="text-xs font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>

                        {stats.todayAppts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-surface-400 border-2 border-dashed border-surface-100 dark:border-surface-800 rounded-xl bg-surface-50/50 dark:bg-surface-800/30">
                                <CalendarCheck size={48} className="mb-4 opacity-20" />
                                <p>{t('noAppointmentsToday')}</p>
                                <Button variant="outline" className="mt-4" onClick={() => {}}>
                                    Schedule Appointment
                                </Button>
                            </div>
                        ) : (
                            <div className="relative space-y-0">
                                {/* Vertical Line */}
                                <div className="absolute left-6 top-4 bottom-4 w-px bg-surface-200 dark:bg-surface-800" />

                                {stats.todayAppts.map((apt) => {
                                    const isNext = stats.nextAppt?.id === apt.id;
                                    const isPast = new Date(apt.end) < new Date();
                                    
                                    return (
                                        <div key={apt.id} className="relative pl-14 py-2 group">
                                            {/* Time Bubble */}
                                            <div className={cn(
                                                "absolute left-0 top-3 w-12 text-xs font-bold text-right pr-4 z-10 transition-colors",
                                                isNext ? "text-primary-600 dark:text-primary-400" : "text-surface-500"
                                            )}>
                                                {formatTime(apt.start)}
                                            </div>
                                            
                                            {/* Timeline Node */}
                                            <div className={cn(
                                                "absolute left-[21px] top-3.5 w-3 h-3 rounded-full border-2 z-10 transition-all",
                                                apt.status === 'completed' ? "bg-green-500 border-green-500" :
                                                isNext ? "bg-white dark:bg-surface-900 border-primary-500 scale-125 ring-4 ring-primary-100 dark:ring-primary-900/30" :
                                                isPast ? "bg-surface-300 border-surface-300" :
                                                "bg-white dark:bg-surface-900 border-orange-400"
                                            )} />

                                            {/* Card */}
                                            <div className={cn(
                                                "rounded-xl p-4 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4",
                                                isNext 
                                                    ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 shadow-md transform scale-[1.02]" 
                                                    : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-sm",
                                                apt.status === 'completed' && "opacity-75 bg-surface-50 dark:bg-surface-800/50"
                                            )}>
                                                <div className="flex-1">
                                                    <h4 className={cn("font-bold text-base", apt.status === 'completed' ? "text-surface-700 dark:text-surface-300 line-through decoration-surface-400" : "text-surface-900 dark:text-white")}>
                                                        {apt.patientName}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-surface-500 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12}/> {formatTime(apt.start)} - {formatTime(apt.end)}
                                                        </span>
                                                        {apt.observation && (
                                                            <span className="flex items-center gap-1 text-surface-400">
                                                                <FileText size={12}/> Note
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {apt.status === 'confirmed' && (
                                                        <Button size="sm" onClick={() => initiateValidate(apt)} className="h-8 text-xs bg-green-600 hover:bg-green-700 shadow-none gap-1">
                                                            <CheckCircle size={14} /> {t('validate')}
                                                        </Button>
                                                    )}
                                                    {apt.status === 'completed' && (
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded flex items-center gap-1">
                                                            <CheckCircle size={12} /> {t('completed')}
                                                        </span>
                                                    )}
                                                    {apt.status === 'pending' && (
                                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                                                            {/* @ts-ignore */}
                                                            {t('pending')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Column: Widgets (1/3 width) */}
                <div className="space-y-6">
                    
                    {/* Quick Actions */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                            <h3 className="font-bold text-surface-900 dark:text-white text-sm uppercase tracking-wide">Quick Actions</h3>
                        </div>
                        <div className="p-2 space-y-1">
                            <button className="w-full text-left p-3 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg">
                                        <Calendar size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">New Appointment</span>
                                </div>
                                <ChevronRight size={16} className="text-surface-400 group-hover:text-primary-500" />
                            </button>
                            <button className="w-full text-left p-3 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                        <User size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Register Patient</span>
                                </div>
                                <ChevronRight size={16} className="text-surface-400 group-hover:text-purple-500" />
                            </button>
                            <button className="w-full text-left p-3 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                        <Wallet size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Create Invoice</span>
                                </div>
                                <ChevronRight size={16} className="text-surface-400 group-hover:text-green-500" />
                            </button>
                        </div>
                    </Card>

                    {/* Inventory Health */}
                    <Card className="p-0 overflow-hidden border-orange-200 dark:border-orange-900/30">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900/30 flex justify-between items-center">
                            <h3 className="font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2 text-sm uppercase tracking-wide">
                                <AlertOctagon size={16} /> Cabinet Alerts
                            </h3>
                            <span className="bg-white dark:bg-surface-900 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/50">
                                {stats.alerts.lowStock.length + stats.alerts.expiringSoon.length}
                            </span>
                        </div>
                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {(stats.alerts.lowStock.length === 0 && stats.alerts.expiringSoon.length === 0) ? (
                                <div className="p-6 text-center text-surface-500 text-sm">
                                    <CheckCircle size={32} className="mx-auto mb-2 text-green-500 opacity-50" />
                                    All items healthy.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {stats.alerts.lowStock.map(item => (
                                        <div key={item.id} className="p-3 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg flex items-start gap-3 transition-colors">
                                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-surface-900 dark:text-white line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-red-600 dark:text-red-400">Low Stock: {item.stock} (Min: {item.minStock})</p>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.alerts.expiringSoon.map(item => (
                                        <div key={item.id} className="p-3 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg flex items-start gap-3 transition-colors">
                                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-surface-900 dark:text-white line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                                    Expiring on {new Date(item.expiryDate!).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-2 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-700 text-center">
                            <button className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center justify-center gap-1 w-full">
                                Go to Inventory <ArrowRight size={12} />
                            </button>
                        </div>
                    </Card>

                    {/* Simple Financial Summary Widget */}
                    <Card className="p-6 bg-gradient-to-br from-surface-900 to-surface-800 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Month to Date</p>
                                <h4 className="text-2xl font-bold mt-1">{stats.revenueMonth.toLocaleString()} DH</h4>
                            </div>
                            <div className="bg-surface-700 p-2 rounded-lg">
                                <TrendingUp size={20} className="text-green-400" />
                            </div>
                        </div>
                        <div className="w-full bg-surface-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full w-[65%]" />
                        </div>
                        <p className="text-xs text-surface-400 mt-2">65% of monthly goal reached</p>
                    </Card>

                </div>
            </div>
        </div>
      </div>

      {/* Validation Modal */}
      <Modal
        isOpen={!!appointmentToValidate}
        onClose={() => setAppointmentToValidate(null)}
        title={t('validateConsultationTitle')}
        maxWidth="sm"
      >
        <div className="text-center p-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                {t('validateConsultationTitle')}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
                {t('validateConsultationDesc').replace('{name}', appointmentToValidate?.patientName || '')}
            </p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setAppointmentToValidate(null)}>{t('cancel')}</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={confirmValidate} disabled={isValidating}>
                    {isValidating ? <Loader2 className="animate-spin" /> : t('yesValidate')}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
