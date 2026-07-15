
import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Invoice, Payment } from '../../../types';
import { useLanguage } from '../../language/LanguageContext';
import { Coins, Loader2, Calendar } from 'lucide-react';
import { api } from '../../../lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentRecorded: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded
}) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate remaining
  const paidSoFar = invoice.paidAmount || 0;
  const remaining = Math.max(0, invoice.amount - paidSoFar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
        // Calculate new totals
        const newPaidAmount = paidSoFar + paymentAmount;
        let newStatus: 'paid' | 'partial' | 'unpaid' = 'partial';
        
        if (newPaidAmount >= invoice.amount) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partial';
        } else {
            newStatus = 'unpaid';
        }

        const newPayment: Payment = {
            id: Math.random().toString(36).substr(2, 9),
            amount: paymentAmount,
            date: new Date(date).toISOString(),
            method
        };

        const updatedInvoice: Invoice = {
            ...invoice,
            paidAmount: newPaidAmount,
            status: newStatus,
            payments: [...(invoice.payments || []), newPayment]
        };

        await api.invoices.update(updatedInvoice);
        onPaymentRecorded();
        onClose();
    } catch (e) {
        alert(t('recordPaymentFailed'));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('recordPayment')}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
             <div className="flex justify-between items-center mb-1">
                 <span className="text-sm text-surface-500">{t('totalInvoiced')}</span>
                 <span className="font-bold text-surface-900 dark:text-white">{invoice.amount.toFixed(2)} DH</span>
             </div>
             <div className="flex justify-between items-center mb-1">
                 <span className="text-sm text-surface-500">{t('paid')}</span>
                 <span className="font-medium text-green-600">{paidSoFar.toFixed(2)} DH</span>
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-surface-200 dark:border-surface-700">
                 <span className="text-sm font-bold text-surface-900 dark:text-white">{t('remaining')}</span>
                 <span className="font-bold text-red-600">{remaining.toFixed(2)} DH</span>
             </div>
        </div>

        <div className="space-y-4">
            <div className="relative">
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                    {t('amount')} (DH)
                </label>
                <div className="relative">
                    <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <Input 
                        type="number" 
                        className="pl-10" 
                        placeholder={remaining.toFixed(2)} 
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        max={remaining}
                        autoFocus
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                        {t('date')}
                    </label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
                        <Input 
                            type="date"
                            className="pl-10"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                </div>
                
                <div>
                     <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                        {t('method')}
                    </label>
                    <select
                        className="w-full h-10 px-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={method}
                        onChange={e => setMethod(e.target.value as any)}
                    >
                        <option value="cash">{t('methodCash')}</option>
                        <option value="card">{t('methodCard')}</option>
                        <option value="check">{t('methodCheck')}</option>
                        <option value="transfer">{t('methodTransfer')}</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-700 mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16}/>}
                {t('confirm')}
            </Button>
        </div>
      </form>
    </Modal>
  );
};
