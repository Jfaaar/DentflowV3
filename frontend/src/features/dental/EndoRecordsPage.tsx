// Endodontic records — patient-scoped page at /app/patients/:patientId/endo
// (gated by the endoChart feature). Lists a patient's root-canal records,
// newest first; click to edit.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus, Pencil, Trash2, Loader2, Activity } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useListEndoRecordsQuery,
  useDeleteEndoRecordMutation,
  type EndoRecord,
} from './api/endoApi';
import { EndoRecordModal } from './components/EndoRecordModal';

interface Props {
  patientId: string;
  patientName?: string;
  onBack?: () => void;
}

function canalSummary(rec: EndoRecord): string {
  if (!rec.canals?.length) return '—';
  const named = rec.canals.map((c) => c.name?.trim()).filter(Boolean) as string[];
  if (named.length) return `${rec.canals.length} · ${named.join(', ')}`;
  return `${rec.canals.length}`;
}

export const EndoRecordsPage: React.FC<Props> = ({ patientId, patientName, onBack }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useListEndoRecordsQuery({ patientId, pageSize: 100 });
  const [deleteRec] = useDeleteEndoRecordMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EndoRecord | null>(null);

  const rows = data?.data ?? [];

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: EndoRecord) => { setEditing(r); setModalOpen(true); };
  const handleDelete = async (r: EndoRecord) => {
    if (!window.confirm(t('endoDeleteConfirm', 'Delete this endo record?'))) return;
    try { await deleteRec(r.id).unwrap(); } catch { /* list refetches on success */ }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('endoTitle', 'Endodontic records')}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ChevronLeft size={16} />{t('back', 'Back')}
          </Button>
        )}
        <Button onClick={openNew}><Plus size={18} className="mr-1.5" />{t('endoNewTitle', 'New endo record')}</Button>
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
        {patientName && (
          <p className="text-sm text-surface-500">{t('patient', 'Patient')}: <span className="font-medium text-surface-800 dark:text-surface-200">{patientName}</span></p>
        )}

        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center text-surface-500">
              <Loader2 size={20} className="animate-spin mr-2" />{t('loading', 'Loading…')}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-surface-500">
              <Activity size={28} className="mx-auto mb-2 opacity-40" />
              {t('endoEmpty', 'No endodontic records for this patient yet.')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-surface-900 text-surface-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start font-medium px-4 py-2.5">{t('perioTooth', 'Tooth')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('endoTreatmentDate', 'Date')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('endoDiagnosis', 'Diagnosis')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('endoCanals', 'Canals')}</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                    <td className="px-4 py-2.5 font-medium text-surface-900 dark:text-white">{r.tooth}</td>
                    <td className="px-4 py-2.5 text-surface-500">{r.treatmentDate?.split('T')[0] ?? '—'}</td>
                    <td className="px-4 py-2.5 text-surface-600 dark:text-surface-300">{r.diagnosis || '—'}</td>
                    <td className="px-4 py-2.5 text-surface-600 dark:text-surface-300">{canalSummary(r)}</td>
                    <td className="px-4 py-2.5 text-end whitespace-nowrap">
                      <button onClick={() => openEdit(r)} className="text-surface-400 hover:text-primary-600 p-1" title={t('edit', 'Edit') as string}><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(r)} className="text-surface-400 hover:text-red-600 p-1 ml-1" title={t('delete', 'Delete') as string}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <EndoRecordModal isOpen={modalOpen} onClose={() => setModalOpen(false)} patientId={patientId} existing={editing} />
    </div>
  );
};
