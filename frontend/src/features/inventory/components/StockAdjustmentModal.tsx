

import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { InventoryItem } from '../../../types';
import { useLanguage } from '../../language/LanguageContext';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onConfirm: (id: string, quantity: number, reason: string) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm
}) => {
  const { t } = useLanguage();
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;

    const finalQty = type === 'add' ? qty : -qty;
    
    setIsSubmitting(true);
    try {
        await onConfirm(item.id, finalQty, reason);
        onClose();
    } catch (e) {
        // Error handled by parent usually, or alert here
    } finally {
        setIsSubmitting(false);
    }
  };

  const newStock = type === 'add' 
    ? item.stock + (parseInt(quantity) || 0)
    : item.stock - (parseInt(quantity) || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('adjustStock')}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-800 p-4 rounded-xl">
            <div>
                <p className="text-sm font-medium text-surface-500">{t('medicamentName')}</p>
                <p className="font-bold text-lg text-surface-900 dark:text-white">{item.name}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium text-surface-500">{t('stock')}</p>
                <p className="font-bold text-lg text-surface-900 dark:text-white">{item.stock}</p>
            </div>
        </div>

        {/* Toggle */}
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            <button
                type="button"
                onClick={() => setType('add')}
                className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2",
                    type === 'add' 
                        ? "bg-white dark:bg-surface-700 text-green-600 shadow-sm" 
                        : "text-surface-500 hover:text-surface-900 dark:text-surface-400"
                )}
            >
                <Plus size={16} /> {t('addStock')}
            </button>
            <button
                type="button"
                onClick={() => setType('remove')}
                className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2",
                    type === 'remove' 
                        ? "bg-white dark:bg-surface-700 text-red-600 shadow-sm" 
                        : "text-surface-500 hover:text-surface-900 dark:text-surface-400"
                )}
            >
                <Minus size={16} /> {t('removeStock')}
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
            <Input 
                type="number"
                label={t('quantity')}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="1"
                required
                autoFocus
                className="text-lg font-bold"
            />
            <div className="mb-2 text-sm font-medium text-surface-500 flex items-center gap-2">
                <ArrowRight size={16} />
                {t('newStock')}: <span className={cn("font-bold", newStock < 0 ? "text-red-500" : "text-surface-900 dark:text-white")}>{newStock}</span>
            </div>
        </div>

        <Input
            label={t('reason')}
            placeholder={type === 'add' ? t('placeholderAddReason') : t('placeholderRemoveReason')}
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
        />

        <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={isSubmitting || newStock < 0} className={type === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}>
                {t('confirm')}
            </Button>
        </div>
      </form>
    </Modal>
  );
};