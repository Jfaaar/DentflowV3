import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { api } from '../../../lib/api';
import { Supplier } from '../../../types';
import { Search, Plus, Pencil, Trash2, Phone, Mail, MapPin, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '../../language/LanguageContext';

interface SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuppliersModal: React.FC<SuppliersModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      setView('list');
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await api.suppliers.list();
      setSuppliers(data);
    } catch (e) {
      console.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(undefined);
    setFormData({});
    setView('form');
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteSupplierConfirm'))) return;
    try {
      await api.suppliers.delete(id);
      fetchSuppliers();
    } catch (e) {
      alert(t('deleteSupplierFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await api.suppliers.update({ ...editingSupplier, ...formData } as Supplier);
      } else {
        await api.suppliers.create(formData as Omit<Supplier, 'id'>);
      }
      await fetchSuppliers();
      setView('list');
    } catch (e) {
      alert(t('saveSupplierFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === 'list' ? t('manageSuppliers') : (editingSupplier ? t('editSupplier') : t('addSupplier'))}
      maxWidth="lg"
    >
      <div className="min-h-[400px] flex flex-col">
        {view === 'list' ? (
          <>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input 
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder={t('search') + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="gap-2">
                <Plus size={18} /> {t('addSupplier')}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center p-8 text-surface-400">
                  <User size={48} className="mx-auto mb-2 opacity-20" />
                  <p>{t('noSuppliersFound')}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredSuppliers.map(supplier => (
                    <div key={supplier.id} className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700 flex justify-between items-start group hover:border-primary-200 dark:hover:border-primary-700 transition-colors">
                      <div>
                        <h4 className="font-bold text-surface-900 dark:text-white text-lg">{supplier.name}</h4>
                        <div className="text-sm text-surface-500 space-y-1 mt-1">
                          {supplier.contactPerson && (
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-surface-400" />
                              {supplier.contactPerson}
                            </div>
                          )}
                          {(supplier.phone || supplier.email) && (
                            <div className="flex items-center gap-3">
                              {supplier.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-surface-400" /> {supplier.phone}</span>}
                              {supplier.email && <span className="flex items-center gap-1.5"><Mail size={14} className="text-surface-400" /> {supplier.email}</span>}
                            </div>
                          )}
                          {supplier.address && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-surface-400" />
                              {supplier.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(supplier)} className="p-2 text-surface-400 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(supplier.id)} className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="space-y-4 flex-1">
              <Input 
                label={t('supplierName')}
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                autoFocus
              />
              <Input 
                label={t('contactPerson')}
                value={formData.contactPerson || ''}
                onChange={e => setFormData({...formData, contactPerson: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label={t('phoneNumber')}
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
                <Input 
                  label={t('emailOptional')}
                  value={formData.email || ''}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <Input 
                label={t('address')}
                value={formData.address || ''}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 dark:border-surface-700 mt-auto">
              <Button type="button" variant="ghost" onClick={() => setView('list')}>
                <ArrowLeft size={16} className="mr-2" /> {t('back')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {editingSupplier ? t('updateSupplier') : t('createSupplier')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};