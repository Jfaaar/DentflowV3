
import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Appointment, Invoice, Payment } from '../../types';
import { formatDate, formatTime, cn } from '../../lib/utils';
import { 
  Receipt, Check, Loader2, DollarSign, Coins, Search, 
  Filter, X, CheckCircle, AlertCircle, PlusCircle, 
  TrendingUp, Wallet, CreditCard, BarChart3,
  CalendarRange, Download, PieChart, Banknote, Landmark
} from 'lucide-react';
import { useLanguage } from '../../features/language/LanguageContext';
import { PaymentModal } from './components/PaymentModal';

export const InvoicesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newStatus, setNewStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [isCreating, setIsCreating] = useState(false);
  
  // Payment Modal State
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null);

  // Filter State
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  
  const [filterStart, setFilterStart] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start.toISOString().split('T')[0];
  });

  const [filterEnd, setFilterEnd] = useState(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
    return end.toISOString().split('T')[0];
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const allInvoices = await api.invoices.list();
        setInvoices(allInvoices);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Date Presets ---
  const applyDatePreset = (preset: 'today' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      switch (preset) {
          case 'today':
              // Start and End are today
              break;
          case 'thisMonth':
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              break;
          case 'lastMonth':
              start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              end = new Date(now.getFullYear(), now.getMonth(), 0);
              break;
          case 'thisYear':
              start = new Date(now.getFullYear(), 0, 1);
              end = new Date(now.getFullYear(), 11, 31);
              break;
      }
      setFilterStart(start.toISOString().split('T')[0]);
      setFilterEnd(end.toISOString().split('T')[0]);
  };

  // --- KPI Calculations ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
        const matchName = filterName === '' || inv.patientName.toLowerCase().includes(filterName.toLowerCase());
        const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
        let matchDate = true;
        const invDate = new Date(inv.date).toISOString().split('T')[0];
        if (filterStart) matchDate = matchDate && invDate >= filterStart;
        if (filterEnd) matchDate = matchDate && invDate <= filterEnd;

        return matchName && matchStatus && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filterName, filterStatus, filterStart, filterEnd]);

  const stats = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalOutstanding = totalRevenue - totalCollected;
    const avgInvoice = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;

    // --- Chart Data (Revenue Trend) ---
    // Group by Month if range > 1 month, else group by Day
    const start = new Date(filterStart);
    const end = new Date(filterEnd);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    
    const chartData = [];
    const isDaily = diffDays <= 32;

    if (isDaily) {
        // Daily Buckets
        for (let i = 0; i <= Math.min(diffDays, 30); i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            const displayLabel = d.getDate().toString();
            
            const daySum = filteredInvoices
                .filter(inv => inv.date.startsWith(key))
                .reduce((sum, inv) => sum + inv.amount, 0);
            
            chartData.push({ label: displayLabel, value: daySum, fullDate: key });
        }
    } else {
        // Monthly Buckets (Approx last 6 or based on range)
        for (let i = 0; i < 6; i++) {
            const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'short' });
            
            const monthSum = filteredInvoices
                .filter(inv => inv.date.startsWith(key))
                .reduce((sum, inv) => sum + inv.amount, 0);
            
            chartData.unshift({ label, value: monthSum, fullDate: key });
        }
    }

    const maxChartValue = Math.max(...chartData.map(d => d.value), 100);

    // --- Payment Methods Distribution ---
    const methods: Record<string, number> = { cash: 0, card: 0, transfer: 0, check: 0 };
    filteredInvoices.forEach(inv => {
        if (inv.payments) {
            inv.payments.forEach(p => {
                const m = p.method || 'cash';
                if (methods[m] !== undefined) methods[m] += p.amount;
            });
        }
        // Fallback for older data or direct paid status without payments array
        if ((!inv.payments || inv.payments.length === 0) && inv.status === 'paid') {
            methods['cash'] += inv.amount;
        }
    });

    const totalMethods = Object.values(methods).reduce((a, b) => a + b, 0);
    const methodStats = [
        { label: 'Cash', value: methods.cash, color: '#22c55e', icon: Banknote },     // Green
        { label: 'Card', value: methods.card, color: '#3b82f6', icon: CreditCard },   // Blue
        { label: 'Check', value: methods.check, color: '#f97316', icon: Receipt },    // Orange
        { label: 'Transfer', value: methods.transfer, color: '#a855f7', icon: Landmark } // Purple
    ].filter(m => m.value > 0);

    // Calculate conic gradient string
    let gradientString = '';
    let currentDeg = 0;
    if (totalMethods > 0) {
        methodStats.forEach((m, idx) => {
            const deg = (m.value / totalMethods) * 360;
            gradientString += `${m.color} ${currentDeg}deg ${currentDeg + deg}deg${idx < methodStats.length - 1 ? ', ' : ''}`;
            currentDeg += deg;
        });
    } else {
        gradientString = '#e2e8f0 0deg 360deg'; // Empty state grey
    }

    return { totalRevenue, totalCollected, totalOutstanding, avgInvoice, chartData, maxChartValue, methodStats, gradientString, totalMethods };
  }, [filteredInvoices, filterStart, filterEnd]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount) return;
    setIsCreating(true);
    try {
        const totalAmount = parseFloat(newAmount);
        const initialPaid = newStatus === 'paid' ? totalAmount : 0; 

        await api.invoices.create({
            appointmentId: 'manual',
            patientId: 'manual', 
            patientName: 'Walk-in Patient', // Simplified for manual entry
            amount: totalAmount,
            paidAmount: initialPaid,
            payments: newStatus === 'paid' ? [{
                id: Math.random().toString(36).substr(2, 9),
                amount: totalAmount,
                date: new Date().toISOString(),
                method: 'cash'
            }] : [],
            status: newStatus,
            date: new Date().toISOString()
        });
        refreshData();
        setShowCreateModal(false);
        setNewAmount('');
    } catch(e) {
        alert("Failed to create invoice");
    } finally {
        setIsCreating(false);
    }
  };

  const handleMarkAsPaid = async (inv: Invoice) => {
      const remaining = inv.amount - (inv.paidAmount || 0);
      if (remaining <= 0) return;
      
      if (!window.confirm(`Mark invoice for ${inv.amount.toFixed(2)} DH as fully paid?`)) return;

      setIsMarkingPaid(inv.id);
      try {
          const newPayment: Payment = {
              id: Math.random().toString(36).substr(2, 9),
              amount: remaining,
              date: new Date().toISOString(),
              method: 'cash'
          };

          const updatedInvoice: Invoice = {
              ...inv,
              paidAmount: inv.amount,
              status: 'paid',
              payments: [...(inv.payments || []), newPayment]
          };

          await api.invoices.update(updatedInvoice);
          refreshData();
      } catch (e) {
          alert("Failed to update invoice");
      } finally {
          setIsMarkingPaid(null);
      }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
          case 'partial': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
          default: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('invoices')} />
      
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* 1. Filter & Quick Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex bg-white dark:bg-surface-800 p-1 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                <button onClick={() => applyDatePreset('today')} className="px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-md transition-colors">Today</button>
                <div className="w-px bg-surface-200 dark:bg-surface-700 my-1"/>
                <button onClick={() => applyDatePreset('thisMonth')} className="px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-md transition-colors">This Month</button>
                <div className="w-px bg-surface-200 dark:bg-surface-700 my-1"/>
                <button onClick={() => applyDatePreset('lastMonth')} className="px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-md transition-colors">Last Month</button>
                <div className="w-px bg-surface-200 dark:bg-surface-700 my-1"/>
                <button onClick={() => applyDatePreset('thisYear')} className="px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-md transition-colors">This Year</button>
            </div>

            <Button className="gap-2 shadow-lg shadow-primary-200 dark:shadow-none" onClick={() => setShowCreateModal(true)}>
                <PlusCircle size={18} /> {t('createInvoice')}
            </Button>
        </div>

        {/* 2. KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-blue-500">
                <div>
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">{t('totalInvoiced')}</p>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.totalRevenue.toFixed(0)} <span className="text-sm font-normal text-surface-500">DH</span></h3>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">
                    <TrendingUp size={12} /> Revenue
                </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-green-500">
                <div>
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">{t('paid')}</p>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.totalCollected.toFixed(0)} <span className="text-sm font-normal text-surface-500">DH</span></h3>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit">
                    <Wallet size={12} /> Collected
                </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-red-500">
                <div>
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">{t('due')}</p>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.totalOutstanding.toFixed(0)} <span className="text-sm font-normal text-surface-500">DH</span></h3>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit">
                    <AlertCircle size={12} /> Outstanding
                </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-purple-500">
                <div>
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Avg Invoice</p>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.avgInvoice.toFixed(0)} <span className="text-sm font-normal text-surface-500">DH</span></h3>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded w-fit">
                    <Coins size={12} /> Per Patient
                </div>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 3. Revenue Trend Chart */}
            <Card className="lg:col-span-2 p-6 flex flex-col h-[320px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary-500"/> Revenue Trend
                    </h3>
                    <div className="text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                        {filteredInvoices.length} invoices in range
                    </div>
                </div>
                
                <div className="flex-1 flex items-end gap-2 md:gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {stats.chartData.length > 0 ? stats.chartData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[20px]">
                            <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-t-sm relative flex items-end overflow-hidden h-[200px]">
                                <div 
                                    className="w-full bg-primary-500 hover:bg-primary-600 transition-all duration-500 relative group-hover:opacity-90 rounded-t-sm"
                                    style={{ height: `${(d.value / stats.maxChartValue) * 100}%` }}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                                        {d.value.toFixed(0)} DH
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-surface-500 uppercase truncate w-full text-center">{d.label}</span>
                        </div>
                    )) : (
                        <div className="w-full h-full flex items-center justify-center text-surface-400 italic text-sm">
                            No data for selected period
                        </div>
                    )}
                </div>
            </Card>

            {/* 4. Payment Distribution (Donut) */}
            <Card className="flex flex-col h-[320px] p-6">
                <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-6">
                    <PieChart size={18} className="text-primary-500"/> Payment Methods
                </h3>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                    {stats.totalMethods > 0 ? (
                        <div className="relative w-40 h-40 rounded-full mb-6" style={{ background: `conic-gradient(${stats.gradientString})` }}>
                            <div className="absolute inset-4 bg-white dark:bg-surface-800 rounded-full flex flex-col items-center justify-center">
                                <span className="text-xs text-surface-500 font-medium">Total</span>
                                <span className="text-lg font-bold text-surface-900 dark:text-white">{stats.totalCollected.toFixed(0)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-40 h-40 rounded-full border-4 border-surface-100 dark:border-surface-800 border-dashed flex items-center justify-center mb-6 text-surface-400 text-xs">
                            No Payments
                        </div>
                    )}

                    <div className="w-full grid grid-cols-2 gap-2">
                        {stats.methodStats.map(m => (
                            <div key={m.label} className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                                <span className="text-surface-600 dark:text-surface-400 flex-1">{m.label}</span>
                                <span className="font-bold">{((m.value / stats.totalMethods) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>

        {/* 5. Transactions Table */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Receipt className="text-surface-500" />
                {t('invoiceHistory')}
            </h3>

            <Card className="overflow-hidden border-none shadow-md" noPadding>
                {/* Filters */}
                <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 flex flex-col xl:flex-row gap-4">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('searchPatient') + "..."}
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0">
                         <div className="flex items-center gap-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg px-3 py-2">
                            <Filter size={14} className="text-surface-400" />
                            <select 
                                className="bg-transparent text-sm focus:outline-none text-surface-700 dark:text-surface-300"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                            >
                                <option value="all">{t('allStatus')}</option>
                                <option value="paid">{t('paidOnly')}</option>
                                <option value="partial">{t('partialOnly')}</option>
                                <option value="unpaid">{t('unpaidOnly')}</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg px-2 py-1">
                            <CalendarRange size={14} className="text-surface-400 ml-1" />
                            <input 
                                type="date"
                                className="bg-transparent text-sm focus:outline-none text-surface-700 dark:text-surface-300 w-32 px-1"
                                value={filterStart}
                                onChange={(e) => setFilterStart(e.target.value)}
                            />
                            <span className="text-surface-400">-</span>
                            <input 
                                type="date"
                                className="bg-transparent text-sm focus:outline-none text-surface-700 dark:text-surface-300 w-32 px-1"
                                value={filterEnd}
                                onChange={(e) => setFilterEnd(e.target.value)}
                            />
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setFilterName(''); setFilterStatus('all'); applyDatePreset('thisMonth'); }}
                            className="text-surface-400 hover:text-red-500"
                            title={t('clearFilters')}
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('tableDate')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('tableName')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('tableAmount')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('paid')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-center">{t('tableStatus')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">{t('tableAction')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-700 bg-white dark:bg-surface-900">
                            {filteredInvoices.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-surface-400">{t('noInvoicesMatch')}</td></tr>
                            ) : filteredInvoices.map(inv => (
                                <tr key={inv.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                    <td className="py-4 px-4 text-sm font-medium text-surface-600 dark:text-surface-300">
                                        {formatDate(new Date(inv.date), language)}
                                        <div className="text-xs text-surface-400 font-normal">{formatTime(inv.date)}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-surface-900 dark:text-white">{inv.patientName}</div>
                                        <div className="text-xs text-surface-500 font-mono">INV-{inv.id.substring(0,6).toUpperCase()}</div>
                                    </td>
                                    <td className="py-4 px-4 font-bold text-surface-900 dark:text-white">{inv.amount.toFixed(2)} DH</td>
                                    <td className="py-4 px-4 text-sm text-surface-600 dark:text-surface-300">{(inv.paidAmount || 0).toFixed(2)} DH</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase border", getStatusBadge(inv.status))}>
                                            {inv.status === 'paid' ? <CheckCircle size={12} /> : inv.status === 'partial' ? <CreditCard size={12}/> : <AlertCircle size={12}/>}
                                            {/* @ts-ignore */}
                                            {t(inv.status)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-surface-400 hover:text-surface-600 h-8 w-8"
                                                title="Download PDF"
                                                onClick={() => alert("Mock PDF Download")}
                                            >
                                                <Download size={16} />
                                            </Button>
                                            
                                            {inv.status !== 'paid' && (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-8 text-xs bg-green-600 hover:bg-green-700 px-3 shadow-none gap-1.5"
                                                        onClick={() => handleMarkAsPaid(inv)}
                                                        disabled={isMarkingPaid === inv.id}
                                                        title={t('markPaid')}
                                                    >
                                                        {isMarkingPaid === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14}/>} 
                                                        <span className="hidden sm:inline">Pay</span>
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-8 text-xs bg-primary-600 hover:bg-primary-700 px-3 shadow-none gap-1.5"
                                                        onClick={() => setInvoiceToPay(inv)}
                                                        title="Add Partial Payment"
                                                    >
                                                        <PlusCircle size={14}/>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

      </div>

      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title={t('createInvoice')}
        maxWidth="sm"
      >
          <form onSubmit={handleCreateInvoice} className="space-y-4 p-1">
              <div className="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                    <p className="text-sm font-bold text-surface-900 dark:text-white">Manual Invoice</p>
                    <p className="text-xs text-surface-500">For walk-in or general services</p>
              </div>
              
              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-500 uppercase">{t('amount')} (DH)</label>
                  <div className="relative">
                      <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                      <Input 
                          type="number" 
                          step="0.01" 
                          className="pl-10" 
                          placeholder="0.00" 
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          autoFocus
                          required
                      />
                  </div>
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-500 uppercase">{t('status')}</label>
                  <div className="flex gap-2">
                      <button
                          type="button"
                          onClick={() => setNewStatus('unpaid')}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                              newStatus === 'unpaid' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'
                          }`}
                      >
                          {t('unpaid')}
                      </button>
                      <button
                          type="button"
                          onClick={() => setNewStatus('paid')}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                              newStatus === 'paid' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'
                          }`}
                      >
                          {t('paid')}
                      </button>
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>{t('cancel')}</Button>
                  <Button type="submit" disabled={!newAmount || isCreating}>
                      {isCreating && <Loader2 className="animate-spin mr-2" size={16}/>}
                      {t('confirm')}
                  </Button>
              </div>
          </form>
      </Modal>

      {invoiceToPay && (
          <PaymentModal
            isOpen={!!invoiceToPay}
            onClose={() => setInvoiceToPay(null)}
            invoice={invoiceToPay}
            onPaymentRecorded={refreshData}
          />
      )}
    </div>
  );
};
