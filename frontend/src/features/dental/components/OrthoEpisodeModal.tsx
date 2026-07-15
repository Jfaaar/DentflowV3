// Create / edit modal for an orthodontic episode (a course of treatment).
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ORTHO_STATUSES,
  useCreateOrthoEpisodeMutation,
  useUpdateOrthoEpisodeMutation,
  type OrthoEpisode,
  type OrthoStatus,
} from '../api/orthoApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  existing?: OrthoEpisode | null;
}

const today = () => new Date().toISOString().split('T')[0];
const APPLIANCE_PRESETS = ['Fixed brackets (metal)', 'Fixed brackets (ceramic)', 'Clear aligners', 'Functional appliance', 'Retainer', 'Other'];

export const OrthoEpisodeModal: React.FC<Props> = ({ isOpen, onClose, patientId, existing }) => {
  const { t } = useTranslation();
  const [createEp, { isLoading: creating }] = useCreateOrthoEpisodeMutation();
  const [updateEp, { isLoading: updating }] = useUpdateOrthoEpisodeMutation();

  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [applianceType, setApplianceType] = useState('');
  const [status, setStatus] = useState<OrthoStatus>('active');
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (existing) {
      setStartDate(existing.startDate?.split('T')[0] ?? today());
      setEndDate(existing.endDate?.split('T')[0] ?? '');
      setApplianceType(existing.applianceType ?? '');
      setStatus(existing.status);
      setPlan(existing.plan ?? '');
      setNotes(existing.notes ?? '');
    } else {
      setStartDate(today());
      setEndDate('');
      setApplianceType('');
      setStatus('active');
      setPlan('');
      setNotes('');
    }
  }, [isOpen, existing]);

  const isEdit = !!existing;
  const busy = creating || updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit && existing) {
        await updateEp({
          id: existing.id,
          patch: { startDate, endDate: endDate || null, applianceType: applianceType || null, status, plan: plan || null, notes: notes || null },
        }).unwrap();
      } else {
        await createEp({
          patientId, startDate, endDate: endDate || null, applianceType: applianceType || null, status, plan: plan || null, notes: notes || null,
        }).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setError(msg ?? t('orthoEpisodeSaveFailed', 'Failed to save the episode'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('orthoEpisodeEditTitle', 'Edit treatment episode') : t('orthoEpisodeNewTitle', 'New treatment episode')} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('orthoStartDate', 'Start date')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label={t('orthoEndDate', 'End date')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-surface-500 mb-1 block">{t('orthoAppliance', 'Appliance')}</span>
            <input
              list="ortho-appliance-presets"
              value={applianceType}
              onChange={(e) => setApplianceType(e.target.value)}
              className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
            />
            <datalist id="ortho-appliance-presets">
              {APPLIANCE_PRESETS.map((a) => <option key={a} value={a} />)}
            </datalist>
          </label>
          <label className="block">
            <span className="text-xs text-surface-500 mb-1 block">{t('status', 'Status')}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as OrthoStatus)} className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm">
              {ORTHO_STATUSES.map((s) => <option key={s} value={s}>{t(`orthoStatus_${s}`, s)}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-surface-500 mb-1 block">{t('orthoPlan', 'Treatment plan')}</span>
          <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm" />
        </label>
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
