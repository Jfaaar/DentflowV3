// Dental lab-case board — clinic-wide list of prosthetic work sent to
// external labs, with a status filter, due-date highlighting, and create/edit.
// Reachable at /app/dental/lab-cases (gated by the dentalChart feature).
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Patient } from '@/types';
import {
  LAB_CASE_STATUSES,
  useListLabCasesQuery,
  useDeleteLabCaseMutation,
  type DentalLabCase,
  type LabCaseStatus,
} from './api/dentalLabApi';
import { DentalLabCaseModal } from './components/DentalLabCaseModal';

const STATUS_TONE: Record<LabCaseStatus, string> = {
  sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
  received: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  delivered: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
};
const OPEN_STATUSES: LabCaseStatus[] = ['sent', 'in_progress'];

function dueClass(c: DentalLabCase): string {
  if (!c.dueDate || !OPEN_STATUSES.includes(c.status)) return 'text-surface-500';
  const due = new Date(c.dueDate);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'text-red-600 dark:text-red-400 font-medium';
  if (days <= 3) return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-surface-500';
}

export const DentalLabCasesPage: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<LabCaseStatus | 'all'>('all');
  const { data, isLoading, isFetching } = useListLabCasesQuery(
    statusFilter === 'all' ? { pageSize: 200 } : { status: statusFilter, pageSize: 200 },
  );
  const [deleteLabCase] = useDeleteLabCaseMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DentalLabCase | null>(null);

  // Resolve patient names from the legacy patients list (the lab-case API
  // only carries patientId).
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    api.patients.list().then((ps: Patient[]) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const p of ps) map[p.id] = p.name;
      setPatientNames(map);
    }).catch(() => { /* names are best-effort */ });
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const s of LAB_CASE_STATUSES) c[s] = 0;
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: DentalLabCase) => { setEditing(c); setModalOpen(true); };
  const handleDelete = async (c: DentalLabCase) => {
    if (!window.confirm(t('labCaseDeleteConfirm', 'Delete this lab case?'))) return;
    try { await deleteLabCase(c.id).unwrap(); } catch { /* swallow — list refetches on success */ }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('labCasesTitle', 'Dental lab cases')}>
        <Button onClick={openNew}>
          <Plus size={18} className="mr-1.5" />
          {t('labCaseNewTitle', 'New lab case')}
        </Button>
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {(['all', ...LAB_CASE_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                statusFilter === s
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200'
                  : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
              )}
            >
              {s === 'all' ? t('all', 'All') : t(`labCaseStatus_${s}`, s.replace('_', ' '))}
              <span className="ml-1.5 opacity-60">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center text-surface-500">
              <Loader2 size={20} className="animate-spin mr-2" />{t('loading', 'Loading…')}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-surface-500">
              <FlaskConical size={28} className="mx-auto mb-2 opacity-40" />
              {t('labCasesEmpty', 'No lab cases yet.')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-surface-900 text-surface-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start font-medium px-4 py-2.5">{t('patient', 'Patient')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('labCaseType', 'Type')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('labCaseLabName', 'Lab')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('labCaseSentDate', 'Sent')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('labCaseDueDate', 'Due')}</th>
                  <th className="text-start font-medium px-4 py-2.5">{t('status', 'Status')}</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                    <td className="px-4 py-2.5 text-surface-900 dark:text-white">
                      {patientNames[c.patientId] ?? c.patientId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-surface-600 dark:text-surface-300">
                      {t(`labCaseType_${c.caseType}`, c.caseType.replace('_', ' '))}
                    </td>
                    <td className="px-4 py-2.5 text-surface-600 dark:text-surface-300">{c.labName}</td>
                    <td className="px-4 py-2.5 text-surface-500">{c.sentDate?.split('T')[0] ?? '—'}</td>
                    <td className={cn('px-4 py-2.5', dueClass(c))}>{c.dueDate?.split('T')[0] ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs px-2 py-0.5 rounded-md', STATUS_TONE[c.status])}>
                        {t(`labCaseStatus_${c.status}`, c.status.replace('_', ' '))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-end whitespace-nowrap">
                      <button onClick={() => openEdit(c)} className="text-surface-400 hover:text-primary-600 p-1" title={t('edit', 'Edit') as string}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-surface-400 hover:text-red-600 p-1 ml-1" title={t('delete', 'Delete') as string}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {isFetching && !isLoading && (
            <div className="px-4 py-1.5 text-xs text-surface-400 border-t border-surface-100 dark:border-surface-800">
              {t('refreshing', 'Refreshing…')}
            </div>
          )}
        </Card>
      </div>

      <DentalLabCaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)} existing={editing} />
    </div>
  );
};
