

import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { InventoryItem, InventoryItemType } from '../../types';
import { Search, Package, Plus, Pencil, Trash2, AlertTriangle, Loader2, Filter, Archive, CalendarOff, ArrowLeftRight, Box, Settings, Wrench, Coins, PackageCheck, AlertOctagon, Truck } from 'lucide-react';
import { useLanguage } from '../../features/language/LanguageContext';
import { MedicamentModal } from './components/MedicamentModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { SuppliersModal } from './components/SuppliersModal';
import { cn, formatDate } from '../../lib/utils';

export const InventoryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState<'all' | InventoryItemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Expired' | 'Maintenance'>('All');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null);
  const [isSuppliersOpen, setIsSuppliersOpen] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
        const data = await api.inventory.list();
        setItems(data);
    } catch (e) {
        console.error("Failed to load inventory");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Compute Items for current tab FIRST to derive categories and stats correctly
  const tabItems = useMemo(() => {
      if (activeTab === 'all') return items;
      return items.filter(i => i.type === activeTab);
  }, [items, activeTab]);

  // Derive Stats from Tab Items
  const stats = useMemo(() => {
      const totalCount = tabItems.length;
      const totalValue = tabItems.reduce((sum, item) => sum + ((item.price || 0) * item.stock), 0);
      const lowStockCount = tabItems.filter(i => i.stock <= (i.minStock || 0)).length;
      
      // Critical metric depends on type
      let criticalCount = 0;
      let criticalLabel = t('expiringSoon');

      if (activeTab === 'equipment') {
          criticalLabel = t('maintenanceDue');
          const now = new Date();
          criticalCount = tabItems.filter(i => {
              if (!i.lastMaintenance) return false;
              const last = new Date(i.lastMaintenance);
              const next = new Date(last);
              next.setMonth(next.getMonth() + 6); // Assume 6 month interval
              return next <= now;
          }).length;
      } else {
          // Meds/Consumables check expiry
          const threeMonths = new Date();
          threeMonths.setMonth(threeMonths.getMonth() + 3);
          criticalCount = tabItems.filter(i => {
              if (!i.expiryDate) return false;
              return new Date(i.expiryDate) <= threeMonths;
          }).length;
      }
      
      // Extract categories relevant to current view
      const categories = Array.from(new Set(tabItems.map(i => i.category).filter(Boolean))) as string[];
      
      return { totalCount, totalValue, lowStockCount, criticalCount, criticalLabel, categories };
  }, [tabItems, activeTab, t]);

  // Reset category/stock filter when tab changes to prevent invalid states
  useEffect(() => {
      setCategoryFilter('All');
      setStockFilter('All');
  }, [activeTab]);

  const filteredItems = useMemo(() => {
      let result = tabItems;

      // 1. Search
      if (searchQuery) {
          const lower = searchQuery.toLowerCase();
          result = result.filter(i => 
              i.name.toLowerCase().includes(lower) || 
              i.description?.toLowerCase().includes(lower) ||
              i.supplier?.toLowerCase().includes(lower) ||
              i.brand?.toLowerCase().includes(lower) ||
              i.serialNumber?.toLowerCase().includes(lower) ||
              i.category?.toLowerCase().includes(lower)
          );
      }

      // 2. Category
      if (categoryFilter !== 'All') {
          result = result.filter(i => i.category === categoryFilter);
      }

      // 3. Status
      if (stockFilter === 'Low') {
          result = result.filter(i => i.stock <= (i.minStock || 10));
      } else if (stockFilter === 'Expired') {
          const today = new Date();
          result = result.filter(i => i.expiryDate && new Date(i.expiryDate) <= today);
      } else if (stockFilter === 'Maintenance') {
          const today = new Date();
          result = result.filter(i => {
              if (!i.lastMaintenance) return false;
              const next = new Date(i.lastMaintenance);
              next.setMonth(next.getMonth() + 6);
              return next <= today;
          });
      }

      return result;
  }, [tabItems, searchQuery, categoryFilter, stockFilter]);

  const handleSave = async (data: Omit<InventoryItem, 'id'>) => {
      try {
          if (editingItem) {
              await api.inventory.update({ ...editingItem, ...data });
          } else {
              await api.inventory.create(data);
          }
          fetchInventory();
          setIsModalOpen(false);
      } catch (e) {
          alert(t('saveItemFailed'));
      }
  };

  const handleAdjustStock = async (id: string, qty: number, reason: string) => {
      try {
          await api.inventory.adjustStock(id, qty, reason);
          fetchInventory();
      } catch (e) {
          alert(t('adjustStockFailed'));
      }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm(t('deleteItemConfirm'))) return;
      try {
          await api.inventory.delete(id);
          fetchInventory();
      } catch (e) {
          alert(t('deleteItemFailed'));
      }
  };

  const openNew = () => {
      setEditingItem(undefined);
      setIsModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const openAdjustment = (item: InventoryItem) => {
      setAdjustmentItem(item);
      setIsAdjustmentOpen(true);
  };

  const getTypeIcon = (type: InventoryItemType) => {
      switch (type) {
          case 'medicament': return <Box size={16} className="text-blue-500" />;
          case 'consumable': return <PackageCheck size={16} className="text-purple-500" />;
          case 'equipment': return <Wrench size={16} className="text-orange-500" />;
          default: return <Package size={16} />;
      }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
        <Topbar title={t('inventory')} />

        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* 1. Dynamic KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Card className="p-5 flex items-center gap-4 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
                         <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                             <Package size={24} />
                         </div>
                         <div>
                             <p className="text-xs text-surface-500 font-bold uppercase tracking-wider">{t('totalItems')}</p>
                             <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.totalCount}</p>
                         </div>
                     </Card>
                     
                     <Card className="p-5 flex items-center gap-4 border-l-4 border-l-green-500 hover:shadow-md transition-all">
                         <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                             <Coins size={24} />
                         </div>
                         <div>
                             <p className="text-xs text-surface-500 font-bold uppercase tracking-wider">{t('totalValue')}</p>
                             <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.totalValue.toLocaleString()} <span className="text-sm font-normal text-surface-400">DH</span></p>
                         </div>
                     </Card>

                     <Card className={cn(
                         "p-5 flex items-center gap-4 border-l-4 hover:shadow-md transition-all",
                         stats.lowStockCount > 0 ? "border-l-red-500" : "border-l-surface-300"
                     )}>
                         <div className={cn("p-3 rounded-full", stats.lowStockCount > 0 ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-surface-100 text-surface-500 dark:bg-surface-800")}>
                             <AlertOctagon size={24} />
                         </div>
                         <div>
                             <p className="text-xs text-surface-500 font-bold uppercase tracking-wider">{t('lowStock')}</p>
                             <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.lowStockCount}</p>
                         </div>
                     </Card>

                     <Card className="p-5 flex items-center gap-4 border-l-4 border-l-purple-500 hover:shadow-md transition-all">
                         <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                             {activeTab === 'equipment' ? <Wrench size={24}/> : <CalendarOff size={24} />}
                         </div>
                         <div>
                             <p className="text-xs text-surface-500 font-bold uppercase tracking-wider">{stats.criticalLabel}</p>
                             <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.criticalCount}</p>
                         </div>
                     </Card>
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col min-h-[600px]">
                    
                    {/* Header: Tabs & Actions */}
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            {/* Segmented Control Tabs */}
                            <div className="bg-surface-100 dark:bg-surface-800 p-1.5 rounded-xl inline-flex self-start overflow-x-auto max-w-full">
                                {(['all', 'medicament', 'consumable', 'equipment'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-200",
                                            activeTab === tab 
                                                ? "bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm" 
                                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200/50 dark:hover:bg-surface-700/50"
                                        )}
                                    >
                                        {tab === 'medicament' && <Box size={14}/>}
                                        {tab === 'consumable' && <Settings size={14}/>}
                                        {tab === 'equipment' && <Wrench size={14}/>}
                                        {tab === 'all' && <PackageCheck size={14}/>}
                                        {tab === 'all' ? t('allStatus') : t(`type_${tab}` as any)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    className="gap-2 border border-surface-200 dark:border-surface-700"
                                    onClick={() => setIsSuppliersOpen(true)}
                                >
                                    <Truck size={18} /> {t('manageSuppliers')}
                                </Button>
                                <Button className="gap-2 shadow-lg shadow-primary-200/50 dark:shadow-none" onClick={openNew}>
                                    <Plus size={18} /> {t('addItem')}
                                </Button>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                                <input 
                                    type="text"
                                    placeholder={t('search') + "..."}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                                <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 shrink-0">
                                    <Filter size={16} className="text-surface-400" />
                                    <select 
                                        className="bg-transparent text-sm focus:outline-none text-surface-700 dark:text-surface-300 cursor-pointer min-w-[100px]"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="All">{t('allCategories')}</option>
                                        {stats.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 shrink-0">
                                    <Archive size={16} className="text-surface-400" />
                                    <select 
                                        className="bg-transparent text-sm focus:outline-none text-surface-700 dark:text-surface-300 cursor-pointer min-w-[100px]"
                                        value={stockFilter}
                                        onChange={(e) => setStockFilter(e.target.value as any)}
                                    >
                                        <option value="All">{t('allStatus')}</option>
                                        <option value="Low">{t('lowStock')}</option>
                                        {activeTab !== 'equipment' && <option value="Expired">{t('expiringSoon')}</option>}
                                        {activeTab === 'equipment' && <option value="Maintenance">{t('maintenanceDue')}</option>}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-50/50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs w-10"></th>
                                    <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs">{t('medicamentName')}</th>
                                    <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs">{t('stock')}</th>
                                    {activeTab !== 'equipment' && <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs hidden md:table-cell">{t('expiryDate')}</th>}
                                    {activeTab === 'equipment' && <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs hidden md:table-cell">{t('serialNumber')}</th>}
                                    <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs hidden lg:table-cell">{t('supplier')}</th>
                                    <th className="py-3 px-6 font-semibold text-surface-500 uppercase tracking-wider text-xs text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary-500 w-10 h-10"/></td></tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr><td colSpan={7} className="p-20 text-center text-surface-400 italic">{t('noItemsMatch')}</td></tr>
                                ) : filteredItems.map(item => {
                                    const isLow = item.stock <= (item.minStock || 10);
                                    const stockPercent = Math.min(100, (item.stock / (item.minStock * 4 || 40)) * 100);
                                    
                                    // Status Logic
                                    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
                                    const isExpired = expiry && expiry < new Date();
                                    const isExpiringSoon = expiry && expiry < new Date(new Date().setMonth(new Date().getMonth() + 3));
                                    
                                    // Maintenance Logic
                                    let isMaintenanceDue = false;
                                    if (item.type === 'equipment' && item.lastMaintenance) {
                                        const nextMaint = new Date(item.lastMaintenance);
                                        nextMaint.setMonth(nextMaint.getMonth() + 6);
                                        isMaintenanceDue = nextMaint <= new Date();
                                    }

                                    return (
                                        <tr key={item.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                            <td className="py-4 px-6 text-surface-400">
                                                {getTypeIcon(item.type)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-surface-900 dark:text-white flex items-center gap-2 text-base">
                                                    {item.name}
                                                    {isLow && <span className="w-2 h-2 rounded-full bg-red-500 md:hidden" title={t('lowStockTooltip')}/>}
                                                </div>
                                                <div className="text-xs text-surface-500 mt-0.5 flex gap-2">
                                                    <span className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded border border-surface-200 dark:border-surface-700">{item.category || t('uncategorized')}</span>
                                                    {item.form && <span className="opacity-75">• {item.form}</span>}
                                                    {item.brand && <span className="opacity-75">• {item.brand}</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 min-w-[140px]">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        isLow ? "text-red-600" : "text-surface-900 dark:text-white"
                                                    )}>
                                                        {item.stock}
                                                    </span>
                                                    {isLow && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full font-bold">{t('lowBadge')}</span>}
                                                </div>
                                                <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full mt-2 overflow-hidden w-24">
                                                    <div 
                                                        className={cn("h-full rounded-full transition-all duration-500", isLow ? "bg-red-500" : stockPercent < 50 ? "bg-orange-400" : "bg-green-500")} 
                                                        style={{ width: `${stockPercent}%` }}
                                                    />
                                                </div>
                                            </td>
                                            
                                            {/* Dynamic Column */}
                                            {activeTab !== 'equipment' && (
                                                <td className="py-4 px-6 hidden md:table-cell">
                                                    {item.expiryDate ? (
                                                        <span className={cn(
                                                            "text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1.5",
                                                            isExpired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                                            isExpiringSoon ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                                                            "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400"
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", isExpired || isExpiringSoon ? "bg-current" : "bg-surface-400")} />
                                                            {formatDate(new Date(item.expiryDate), language)}
                                                        </span>
                                                    ) : <span className="text-surface-400 text-xs">-</span>}
                                                </td>
                                            )}
                                            {activeTab === 'equipment' && (
                                                <td className="py-4 px-6 hidden md:table-cell">
                                                    <div className="text-xs font-mono text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded w-fit">
                                                        {item.serialNumber || 'N/A'}
                                                    </div>
                                                    {isMaintenanceDue && (
                                                        <span className="text-[10px] text-red-600 font-bold uppercase mt-1 block flex items-center gap-1">
                                                            <AlertTriangle size={10} /> {t('dueNow')}
                                                        </span>
                                                    )}
                                                </td>
                                            )}

                                            <td className="py-4 px-6 text-sm text-surface-600 dark:text-surface-400 hidden lg:table-cell">
                                                {item.supplier || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button 
                                                        onClick={() => openAdjustment(item)}
                                                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors group"
                                                        title={t('adjustStock')}
                                                    >
                                                        <ArrowLeftRight size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openEdit(item)} 
                                                        className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 dark:text-surface-400 transition-colors"
                                                        title={t('editMedicament')}
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {isModalOpen && (
            <MedicamentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={editingItem}
            />
        )}

        {isAdjustmentOpen && adjustmentItem && (
            <StockAdjustmentModal
                isOpen={isAdjustmentOpen}
                onClose={() => setIsAdjustmentOpen(false)}
                item={adjustmentItem}
                onConfirm={handleAdjustStock}
            />
        )}

        <SuppliersModal
            isOpen={isSuppliersOpen}
            onClose={() => setIsSuppliersOpen(false)}
        />
    </div>
  );
};