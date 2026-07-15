// Create / edit modal for an orthodontic visit within an episode.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useCreateOrthoVisitMutation,
  useUpdateOrthoVisitMutation,
  type OrthoVisit,
} from '../api/orthoApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  episodeId: string;
  existing?: OrthoVisit | null;
}

const today = () => new Date().toISOString().split('T')[0];

export const OrthoVisitModal: React.FC<Props> = ({ isOpen, onClose, episodeId, existing }) => {
  const { t } = useTranslation();
  const [createVisit, { isLoading: creating }] = useCreateOrthoVisitMutation();
  const [updateVisit, { isLoading: updating }] = useUpdateOrthoVisitMutation();

  const [visitDate, setVisitDate] = useState(today());
  const [changes, setChanges] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (existing) {
      setVisitDate(existing.visitDate?.split('T')[0] ?? today());
      setChanges(existing.changes ?? '');
      setAdjustments(existing.adjustments ?? '');
      setNotes(existing.notes ?? '');
    } else {
      setVisitDate(today());
      setChanges('');
      setAdjustments('');
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
        await updateVisit({ id: existing.id, episodeId, patch: { visitDate, changes: changes || null, adjustments: adjustments || null, notes: notes || null } }).unwrap();
      } else {
        await createVisit({ episodeId, body: { visitDate, changes: changes || null, adjustments: adjustments || null, notes: notes || null } }).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setError(msg ?? t('orthoVisitSaveFailed', 'Failed to save the visit'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('orthoVisitEditTitle', 'Edit visit') : t('orthoVisitNewTitle', 'New visit')} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>}
        <Input label={t('orthoVisitDate', 'Visit date')} type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
        <label className="block">
          <span className="text-xs text-surface-500 mb-1 block">{t('orthoChanges', 'Wire / bracket changes')}</span>
          <textarea value={changes} onChange={(e) => setChanges(e.target.value)} rows={2} className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-surface-500 mb-1 block">{t('orthoAdjustments', 'Adjustments')}</span>
          <textarea value={adjustments} onChange={(e) => setAdjustments(e.target.value)} rows={2} className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm" />
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
