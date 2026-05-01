// @ts-nocheck — Phase 3 UI shipped with type-shape divergence from canonical types in types.ts.
// TODO(phase 3 refactor): align this file with the schema-aligned ClinicalNote / DentalChartEntry /
// TreatmentPlan / InsurancePolicy / InsuranceClaim shapes from supabase/migrations/0002.
import React, { useEffect, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../language/LanguageContext';
import { useAuth } from '../auth/useAuth';
import { PermissionGate } from '../../components/auth/PermissionGate';
import { hasPermission } from '../../lib/permissions';
import { treatmentPlansService } from '../../lib/services/treatmentPlans';
import type { TreatmentPlan, TreatmentPlanItem } from '../../types';
import { Loader2, Plus, Check, X, Receipt, CalendarPlus, Trash2 } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

const STATUS_COLORS: Record<TreatmentPlan['status'], string> = {
  draft: 'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
  proposed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
};

export const TreatmentPlanPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [active, setActive] = useState<TreatmentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const canEdit = hasPermission(user?.role, 'treatments.update') || hasPermission(user?.role, 'treatments.create');
  const canAccept = hasPermission(user?.role, 'treatments.accept');
  const canConvert = hasPermission(user?.role, 'treatments.convert');

  const refresh = async () => {
    setIsLoading(true);
    try {
      const list = await treatmentPlansService.list();
      setPlans(list);
      if (active) {
        const fresh = await treatmentPlansService.get(active.id);
        setActive(fresh);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const openPlan = async (id: string) => {
    const p = await treatmentPlansService.get(id);
    setActive(p);
  };

  const accept = async () => {
    if (!active) return;
    await treatmentPlansService.accept(active.id);
    await refresh();
  };

  const reject = async () => {
    if (!active) return;
    await treatmentPlansService.reject(active.id);
    await refresh();
  };

  const convertInvoice = async () => {
    if (!active) return;
    if (!window.confirm(t('confirm'))) return;
    try {
      await treatmentPlansService.convertToInvoice(active.id);
      alert('Invoice created.');
    } catch (e: any) { alert(e.message || 'Failed'); }
  };

  const convertAppts = async () => {
    if (!active) return;
    if (!window.confirm(t('confirm'))) return;
    try {
      const appts = await treatmentPlansService.convertToAppointments(active.id, {});
      alert(`Created ${appts.length} appointments.`);
    } catch (e: any) { alert(e.message || 'Failed'); }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm(t('confirm'))) return;
    await treatmentPlansService.removeItem(id);
    await refresh();
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('treatmentPlans')}>
        <PermissionGate permission="treatments.create">
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} /> {t('newTreatmentPlan')}
          </Button>
        </PermissionGate>
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 lg:col-span-3 space-y-2">
            <div className="text-xs uppercase font-bold text-surface-500 px-1 mb-2">{t('treatmentPlans')}</div>
            {isLoading && (
              <div className="flex items-center justify-center p-6 text-surface-400"><Loader2 className="animate-spin" /></div>
            )}
            {!isLoading && plans.length === 0 && (
              <Card className="text-sm italic text-surface-500">{t('noPlans')}</Card>
            )}
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => openPlan(p.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all',
                  active?.id === p.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                    : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-primary-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-surface-900 dark:text-white truncate">
                    {p.title}
                  </div>
                  <span className={cn('text-[10px] uppercase font-bold px-2 py-0.5 rounded-full', STATUS_COLORS[p.status])}>
                    {t(p.status as any)}
                  </span>
                </div>
                <div className="text-xs text-surface-500 mt-1">{p.patientName ?? p.patientId}</div>
                <div className="text-xs text-primary-600 dark:text-primary-400 font-bold mt-1">{p.total.toFixed(2)}</div>
              </button>
            ))}
          </div>

          <div className="md:col-span-8 lg:col-span-9">
            {!active ? (
              <Card className="text-center text-surface-400">{t('selectPlan')}</Card>
            ) : (
              <Card>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white">{active.title}</h3>
                    <div className="text-sm text-surface-500 mt-1">
                      {active.patientName ?? active.patientId} · {formatDate(new Date(active.createdAt), language)}
                    </div>
                    {active.notes && <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">{active.notes}</p>}
                  </div>
                  <span className={cn('text-xs uppercase font-bold px-3 py-1 rounded-full whitespace-nowrap', STATUS_COLORS[active.status])}>
                    {t(active.status as any)}
                  </span>
                </div>

                {/* Items */}
                <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase text-surface-500">{t('items')}</h4>
                    {canEdit && active.status !== 'accepted' && active.status !== 'completed' && (
                      <Button variant="ghost" size="sm" onClick={() => setShowAddItem(true)} className="gap-1">
                        <Plus size={14} /> {t('addItem')}
                      </Button>
                    )}
                  </div>
                  {(!active.items || active.items.length === 0) ? (
                    <div className="text-sm italic text-surface-400">—</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-surface-500">
                        <tr className="text-left">
                          <th className="py-2">{t('description')}</th>
                          <th className="py-2">{t('tooth')}</th>
                          <th className="py-2 text-right">{t('qty')}</th>
                          <th className="py-2 text-right">{t('price')}</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.items.map(it => (
                          <tr key={it.id} className="border-t border-surface-100 dark:border-surface-800">
                            <td className="py-2">{it.description}</td>
                            <td className="py-2 text-surface-500">{it.toothId ?? '—'}</td>
                            <td className="py-2 text-right">{it.quantity}</td>
                            <td className="py-2 text-right font-mono">{(it.price * it.quantity).toFixed(2)}</td>
                            <td className="py-2 text-right">
                              {canEdit && active.status !== 'accepted' && (
                                <button onClick={() => removeItem(it.id)} className="p-1.5 text-surface-400 hover:text-red-500">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-surface-200 dark:border-surface-700">
                          <td colSpan={3} className="py-2 font-bold uppercase text-xs text-surface-500 text-right">
                            {t('total')}
                          </td>
                          <td className="py-2 text-right font-bold text-primary-600 dark:text-primary-400 font-mono">
                            {active.total.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-2 justify-end">
                  {active.status === 'draft' || active.status === 'proposed' ? (
                    <>
                      <PermissionGate permission="treatments.accept">
                        <Button variant="outline" onClick={reject} className="gap-2">
                          <X size={16} /> {t('reject')}
                        </Button>
                        <Button onClick={accept} className="gap-2">
                          <Check size={16} /> {t('accept')}
                        </Button>
                      </PermissionGate>
                    </>
                  ) : null}
                  {active.status === 'accepted' && canConvert && (
                    <>
                      <Button variant="outline" onClick={convertAppts} className="gap-2">
                        <CalendarPlus size={16} /> {t('convertToAppointments')}
                      </Button>
                      <Button onClick={convertInvoice} className="gap-2">
                        <Receipt size={16} /> {t('convertToInvoice')}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showCreate && user && (
        <CreatePlanModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => { setShowCreate(false); await refresh(); }}
          clinicId={user.clinicId || ''}
        />
      )}

      {showAddItem && active && (
        <AddItemModal
          planId={active.id}
          onClose={() => setShowAddItem(false)}
          onAdded={async () => { setShowAddItem(false); await refresh(); }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const CreatePlanModal: React.FC<{ onClose: () => void; onCreated: () => void; clinicId: string }> = ({ onClose, onCreated, clinicId }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!title || !patientId) return;
    setBusy(true);
    try {
      await treatmentPlansService.create({
        title, patientId, notes,
        status: 'draft',
        clinicId,
      });
      onCreated();
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally { setBusy(false); }
  };
  return (
    <Modal isOpen onClose={onClose} title={t('newTreatmentPlan')} maxWidth="lg">
      <div className="space-y-3">
        <Input label="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)} />
        <Input label={t('planTitle')} value={title} onChange={e => setTitle(e.target.value)} />
        <div>
          <label className="block text-xs font-bold uppercase text-surface-500 mb-1.5">{t('planNotes')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={submit} isLoading={busy}>{t('confirm')}</Button>
        </div>
      </div>
    </Modal>
  );
};

const AddItemModal: React.FC<{ planId: string; onClose: () => void; onAdded: () => void; }> = ({ planId, onClose, onAdded }) => {
  const { t } = useLanguage();
  const [item, setItem] = useState<Partial<TreatmentPlanItem>>({
    description: '', price: 0, quantity: 1,
  });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!item.description) return;
    setBusy(true);
    try {
      await treatmentPlansService.addItem(planId, {
        description: item.description!,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        toothId: item.toothId,
        estimatedDuration: item.estimatedDuration,
      });
      onAdded();
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally { setBusy(false); }
  };
  return (
    <Modal isOpen onClose={onClose} title={t('addItem')} maxWidth="lg">
      <div className="space-y-3">
        <Input label={t('description')} value={item.description ?? ''} onChange={e => setItem({ ...item, description: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <Input label={t('tooth')} value={item.toothId ?? ''} onChange={e => setItem({ ...item, toothId: e.target.value })} />
          <Input label={t('qty')} type="number" value={item.quantity ?? 1} onChange={e => setItem({ ...item, quantity: Number(e.target.value) })} />
          <Input label={t('price')} type="number" step="0.01" value={item.price ?? 0} onChange={e => setItem({ ...item, price: Number(e.target.value) })} />
        </div>
        <Input label={t('estimatedDuration')} type="number" value={item.estimatedDuration ?? ''} onChange={e => setItem({ ...item, estimatedDuration: e.target.value ? Number(e.target.value) : undefined })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={submit} isLoading={busy}>{t('addItem')}</Button>
        </div>
      </div>
    </Modal>
  );
};
