// Create / edit modal for an endodontic record (one tooth, one session).
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ALL_TEETH } from '../perioConstants';
import {
  useCreateEndoRecordMutation,
  useUpdateEndoRecordMutation,
  type EndoRecord,
  type EndoCanal,
} from '../api/endoApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  existing?: EndoRecord | null;
}

const today = () => new Date().toISOString().split('T')[0];

export const EndoRecordModal: React.FC<Props> = ({ isOpen, onClose, patientId, existing }) => {
  const { t } = useTranslation();
  const [createRec, { isLoading: creating }] = useCreateEndoRecordMutation();
  const [updateRec, { isLoading: updating }] = useUpdateEndoRecordMutation();

  const [tooth, setTooth] = useState<string>(ALL_TEETH[0]);
  const [treatmentDate, setTreatmentDate] = useState(today());
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [canals, setCanals] = useState<EndoCanal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (existing) {
      setTooth(existing.tooth);
      setTreatmentDate(existing.treatmentDate?.split('T')[0] ?? today());
      setDiagnosis(existing.diagnosis ?? '');
      setNotes(existing.notes ?? '');
      setCanals(existing.canals?.length ? existing.canals.map((c) => ({ ...c })) : []);
    } else {
      setTooth(ALL_TEETH[0]);
      setTreatmentDate(today());
      setDiagnosis('');
      setNotes('');
      setCanals([{ name: '' }]);
    }
  }, [isOpen, existing]);

  const isEdit = !!existing;
  const busy = creating || updating;

  const updateCanal = (i: number, patch: Partial<EndoCanal>) =>
    setCanals((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeCanal = (i: number) => setCanals((prev) => prev.filter((_, idx) => idx !== i));
  const addCanal = () => setCanals((prev) => [...prev, { name: '' }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Drop fully-empty canal rows before saving.
    const cleanedCanals = canals.filter(
      (c) => (c.name && c.name.trim()) || c.lengthMm != null || (c.fileSize && c.fileSize.trim()) || (c.obturation && c.obturation.trim()),
    );
    try {
      if (isEdit && existing) {
        await updateRec({
          id: existing.id,
          patch: { tooth, treatmentDate, diagnosis: diagnosis || null, notes: notes || null, canals: cleanedCanals },
        }).unwrap();
      } else {
        await createRec({
          patientId, tooth, treatmentDate, diagnosis: diagnosis || null, notes: notes || null, canals: cleanedCanals,
        }).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setError(msg ?? t('endoSaveFailed', 'Failed to save the endo record'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('endoEditTitle', 'Edit endo record') : t('endoNewTitle', 'New endo record')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-surface-500 mb-1 block">{t('perioTooth', 'Tooth')} (FDI)</span>
            <select
              value={tooth}
              onChange={(e) => setTooth(e.target.value)}
              className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
            >
              {ALL_TEETH.map((tn) => <option key={tn} value={tn}>{tn}</option>)}
            </select>
          </label>
          <Input label={t('endoTreatmentDate', 'Treatment date')} type="date" value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} />
        </div>

        <Input label={t('endoDiagnosis', 'Diagnosis')} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder={t('endoDiagnosisPlaceholder', 'e.g. irreversible pulpitis') as string} />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-surface-500">{t('endoCanals', 'Canals')}</span>
            <button type="button" onClick={addCanal} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Plus size={12} />{t('endoAddCanal', 'Add canal')}</button>
          </div>
          {canals.length === 0 ? (
            <p className="text-xs text-surface-400">{t('endoNoCanals', 'No canals recorded.')}</p>
          ) : (
            <div className="space-y-1.5">
              {canals.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder={t('endoCanalName', 'Name (MB, ML, …)') as string}
                    value={c.name ?? ''}
                    onChange={(e) => updateCanal(i, { name: e.target.value })}
                    className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 text-sm w-28"
                  />
                  <input
                    type="number" step="0.5" min={0} max={40}
                    placeholder={t('endoCanalLength', 'WL mm') as string}
                    value={c.lengthMm ?? ''}
                    onChange={(e) => updateCanal(i, { lengthMm: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 text-sm w-20"
                  />
                  <input
                    placeholder={t('endoCanalFileSize', 'Master file') as string}
                    value={c.fileSize ?? ''}
                    onChange={(e) => updateCanal(i, { fileSize: e.target.value })}
                    className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 text-sm w-24"
                  />
                  <input
                    placeholder={t('endoCanalObturation', 'Obturation') as string}
                    value={c.obturation ?? ''}
                    onChange={(e) => updateCanal(i, { obturation: e.target.value })}
                    className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 text-sm flex-1 min-w-0"
                  />
                  <button type="button" onClick={() => removeCanal(i)} className="text-surface-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-xs text-surface-500 mb-1 block">{t('notes', 'Notes')}</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm" />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{t('cancel', 'Cancel')}</Button>
          <Button type="submit" isLoading={busy}>{isEdit ? t('save', 'Save') : t('create', 'Create')}</Button>
        </div>
      </form>
    </Modal>
  );
};
