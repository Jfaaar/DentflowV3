

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { InventoryItem, InventoryItemType, Supplier } from '../../../types';
import { useLanguage } from '../../language/LanguageContext';
import { FileText, Calendar, Tag, Truck, Box, Settings, Wrench, DollarSign } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { api } from '../../../lib/api';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<InventoryItem, 'id'>) => void;
  initialData?: InventoryItem;
}

export const MedicamentModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { t } = useLanguage();
  
  const [type, setType] = useState<InventoryItemType>('medicament');
  const [name, setName] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('10');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [price, setPrice] = useState('');
  
  // Type Specific Fields
  const [form, setForm] = useState(''); // Medicament
  const [expiryDate, setExpiryDate] = useState(''); // Medicament, Consumable
  const [brand, setBrand] = useState(''); // Consumable, Equipment
  const [serialNumber, setSerialNumber] = useState(''); // Equipment
  const [lastMaintenance, setLastMaintenance] = useState(''); // Equipment

  // Suppliers Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (isOpen) {
        api.suppliers.list().then(setSuppliers);

        if (initialData) {
            setType(initialData.type || 'medicament');
            setName(initialData.name);
            setStock(initialData.stock.toString());
            setMinStock(initialData.minStock?.toString() || '10');
            setDescription(initialData.description || '');
            setCategory(initialData.category || '');
            setSupplier(initialData.supplier || '');
            setPrice(initialData.price?.toString() || '');
            
            setForm(initialData.form || '');
            setExpiryDate(initialData.expiryDate || '');
            setBrand(initialData.brand || '');
            setSerialNumber(initialData.serialNumber || '');
            setLastMaintenance(initialData.lastMaintenance || '');
        } else {
            // Defaults
            setType('medicament');
            setName('');
            setStock('0');
            setMinStock('10');
            setDescription('');
            setCategory('');
            setSupplier('');
            setPrice('');
            
            setForm('');
            setExpiryDate('');
            setBrand('');
            setSerialNumber('');
            setLastMaintenance('');
        }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    onSubmit({
        name,
        type,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        description,
        category,
        supplier,
        price: parseFloat(price) || 0,
        
        // Optional Fields
        form: type === 'medicament' ? form : undefined,
        expiryDate: (type === 'medicament' || type === 'consumable') ? expiryDate : undefined,
        brand: (type === 'consumable' || type === 'equipment') ? brand : undefined,
        serialNumber: type === 'equipment' ? serialNumber : undefined,
        lastMaintenance: type === 'equipment' ? lastMaintenance : undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('editMedicament') : t('addItem')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Type Selector (Only if creating new) */}
        {!initialData && (
            <div className="bg-surface-50 dark:bg-surface-800 p-1.5 rounded-xl border border-surface-100 dark:border-surface-700">
                <div className="flex w-full">
                    {(['medicament', 'consumable', 'equipment'] as InventoryItemType[]).map((tVal) => (
                        <button
                            key={tVal}
                            type="button"
                            onClick={() => setType(tVal)}
                            className={cn(
                                "flex-1 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wide transition-all flex items-center justify-center gap-2",
                                type === tVal 
                                    ? "bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400 ring-1 ring-black/5 dark:ring-white/5" 
                                    : "text-surface-500 hover:text-surface-900 dark:text-surface-400 hover:bg-surface-200/50 dark:hover:bg-surface-700/50"
                            )}
                        >
                            {tVal === 'medicament' && <Box size={14} />}
                            {tVal === 'consumable' && <Settings size={14} />}
                            {tVal === 'equipment' && <Wrench size={14} />}
                            {/* @ts-ignore */}
                            {t(`type_${tVal}`)}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider border-b border-surface-100 dark:border-surface-800 pb-2">Basic Information</h4>
            <Input 
                label={t('medicamentName')}
                placeholder={type === 'medicament' ? "e.g. Amoxicillin" : type === 'equipment' ? "e.g. Dental Chair" : "e.g. Latex Gloves"}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                className="text-lg font-medium"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {type === 'medicament' && (
                    <Input 
                        label={t('form')}
                        placeholder="e.g. Tablet, Syrup"
                        value={form}
                        onChange={e => setForm(e.target.value)}
                    />
                )}
                
                {(type === 'consumable' || type === 'equipment') && (
                    <Input 
                        label={t('brand')}
                        placeholder="e.g. 3M, Dentsply"
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                    />
                )}

                <div className="relative">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                        {t('category')}
                    </label>
                    <div className="relative">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <Input 
                            placeholder={type === 'medicament' ? "Antibiotic" : "Hygiene"}
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Section 2: Stock & Values */}
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider border-b border-surface-100 dark:border-surface-800 pb-2">Stock Control</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                <div className="col-span-2 md:col-span-1">
                    <Input 
                        type="number"
                        label={t('stock')}
                        value={stock}
                        onChange={e => setStock(e.target.value)}
                        required
                        disabled={!!initialData}
                        className={initialData ? "bg-surface-200/50 dark:bg-surface-900/50 cursor-not-allowed" : "bg-white dark:bg-surface-900"}
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <Input 
                        type="number"
                        label={t('minStock')}
                        value={minStock}
                        onChange={e => setMinStock(e.target.value)}
                        className="bg-white dark:bg-surface-900"
                    />
                </div>
                <div className="col-span-2">
                    <div className="relative">
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                            {t('costPrice')}
                        </label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                            <Input 
                                type="number"
                                placeholder="0.00"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="pl-10 bg-white dark:bg-surface-900"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 3: Specifics */}
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider border-b border-surface-100 dark:border-surface-800 pb-2">Details</h4>

            {(type === 'medicament' || type === 'consumable') && (
                <div className="relative">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                        {t('expiryDate')}
                    </label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <Input 
                            type="date"
                            value={expiryDate}
                            onChange={e => setExpiryDate(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            )}

            {type === 'equipment' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label={t('serialNumber')}
                        value={serialNumber}
                        onChange={e => setSerialNumber(e.target.value)}
                        placeholder="SN-123456"
                    />
                    <div className="relative">
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                            {t('lastMaintenance')}
                        </label>
                        <Input 
                            type="date"
                            value={lastMaintenance}
                            onChange={e => setLastMaintenance(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                        {t('supplier')}
                    </label>
                    <div className="relative">
                        <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
                        <select 
                            className="w-full pl-10 px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 appearance-none"
                            value={supplier}
                            onChange={e => setSupplier(e.target.value)}
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                            {/* Fallback for existing data not in supplier list */}
                            {supplier && !suppliers.some(s => s.name === supplier) && (
                                <option value={supplier}>{supplier}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                    {t('description')}
                </label>
                <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-surface-400" />
                    <textarea 
                        className="w-full pl-10 px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        placeholder="Optional details..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" className="min-w-[120px]">{t('confirm')}</Button>
        </div>
      </form>
    </Modal>
  );
};