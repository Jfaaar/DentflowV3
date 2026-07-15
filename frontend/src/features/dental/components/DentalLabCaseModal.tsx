// Create / edit modal for a dental lab case.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PatientSelect } from '@/features/patients/components/PatientSelect';
import type { Patient } from '@/types';
import {
  LAB_CASE_TYPES,
  LAB_CASE_STATUSES,
  useCreateLabCaseMutation,
  useUpdateLabCaseMutation,
  type DentalLabCase,
  type LabCaseStatus,
  type LabCaseType,
} from '../api/dentalLabApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Present = edit mode. */
  existing?: DentalLabCase | null;
  /** Optional pre-selected patient (e.g. when opened from a patient record). */
  presetPatient?: Patient | null;
}

const today = () => new Date().toISOString().split('T')[0];

export const DentalLabCaseModal: React.FC<Props> = ({ isOpen, onClose, existing, presetPatient }) => {
  const { t } = useTranslation();
  const [createLabCase, { isLoading: creating }] = useCreateLabCaseMutation();
  const [updateLabCase, { isLoading: updating }] = useUpdateLabCaseMutation();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [labName, setLabName] = useState('');
  const [caseType, setCaseType] = useState<LabCaseType>('crown');
  const [status, setStatus] = useState<LabCaseStatus>('sent');
  const [sentDate, setSentDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (existing) {
      setPatient(null);
      setLabName(existing.labName);
      setCaseType(existing.caseType);
      setStatus(existing.status);
      setSentDate(existing.sentDate?.split('T')[0] ?? today());
      setDueDate(existing.dueDate?.split('T')[0] ?? '');
      setReceivedDate(existing.receivedDate?.split('T')[0] ?? '');
      setNotes(existing.notes ?? '');
    } else {
      setPatient(presetPatient ?? null);
      setLabName('');
      setCaseType('crown');
      setStatus('sent');
      setSentDate(today());
      setDueDate('');
      setReceivedDate('');
      setNotes('');
    }
  }, [isOpen, existing, presetPatient]);

  const isEdit = !!existing;
  const busy = creating || updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit && existing) {
        await updateLabCase({
          id: existing.id,
          patch: {
            labName,
            caseType,
            status,
            sentDate,
            dueDate: dueDate || null,
            receivedDate: receivedDate || null,
            notes: notes || null,
          },
        }).unwrap();
      } else {
        if (!patient) { setError(t('labCaseNeedPatient', 'Select a patient first')); return; }
        await createLabCase({
          patientId: patient.id,
          labName,
          caseType,
          status,
          sentDate,
          dueDate: dueDate || null,
          receivedDate: receivedDate || null,
          notes: notes || null,
        }).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setError(msg ?? t('labCaseSaveFailed', 'Failed to save lab case'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('labCaseEditTitle', 'Edit lab case') : t('labCaseNewTitle', 'New lab case')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {isEdit ? (
          <div className="text-sm text-surface-500">
            {t('patient', 'Patient')}: <span className="font-medium text-surface-800 dark:text-surface-200">{existing?.patientId}</span>
          </div>
        ) : (
          <PatientSelect value={patient} onChange={setPatient} label={t('patient', 'Patient')} />
        )}

        <Input
          label={t('labCaseLabName', 'Lab name')}
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-surface-500 mb-1 block">{t('labCaseType', 'Case type')}</span>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as LabCaseType)}
              className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
            >
              {LAB_CASE_TYPES.map((c) => (
                <option key={c} value={c}>{t(`labCaseType_${c}`, c.replace('_', ' '))}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-surface-500 mb-1 block">{t('status', 'Status')}</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LabCaseStatus)}
              className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
            >
              {LAB_CASE_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`labCaseStatus_${s}`, s.replace('_', ' '))}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label={t('labCaseSentDate', 'Sent')} type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} />
          <Input label={t('labCaseDueDate', 'Due')} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input label={t('labCaseReceivedDate', 'Received')} type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
        </div>

        <label className="block">
          <span className="text-xs text-surface-500 mb-1 block">{t('notes', 'Notes')}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button type="submit" isLoading={busy}>
            {isEdit ? t('save', 'Save') : t('create', 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
