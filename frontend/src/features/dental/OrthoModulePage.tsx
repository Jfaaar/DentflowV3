// Orthodontic tracking — patient-scoped page at /app/patients/:patientId/ortho
// (gated by the orthoModule feature). Lists the patient's treatment episodes;
// each episode expands to a visit timeline.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Plus, Pencil, Trash2, Loader2, Braces, ChevronDown, ChevronRight, CalendarClock,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  useListOrthoEpisodesQuery,
  useDeleteOrthoEpisodeMutation,
  useListOrthoVisitsQuery,
  useDeleteOrthoVisitMutation,
  type OrthoEpisode,
  type OrthoStatus,
  type OrthoVisit,
} from './api/orthoApi';
import { OrthoEpisodeModal } from './components/OrthoEpisodeModal';
import { OrthoVisitModal } from './components/OrthoVisitModal';

interface Props {
  patientId: string;
  patientName?: string;
  onBack?: () => void;
}

const STATUS_TONE: Record<OrthoStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  retention: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  completed: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300',
  discontinued: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
};

const VisitTimeline: React.FC<{
  episodeId: string;
  onEdit: (v: OrthoVisit) => void;
  onAdd: () => void;
}> = ({ episodeId, onEdit, onAdd }) => {
  const { t } = useTranslation();
  const { data: visits, isLoading } = useListOrthoVisitsQuery(episodeId);
  const [deleteVisit] = useDeleteOrthoVisitMutation();
  const handleDelete = async (v: OrthoVisit) => {
    if (!window.confirm(t('orthoVisitDeleteConfirm', 'Delete this visit?'))) return;
    try { await deleteVisit({ id: v.id, episodeId }).unwrap(); } catch { /* refetches on success */ }
  };
  return (
    <div className="mt-3 border-t border-surface-100 dark:border-surface-800 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-surface-400 flex items-center gap-1.5"><CalendarClock size={13} />{t('orthoVisits', 'Visits')}</span>
        <button onClick={onAdd} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Plus size={12} />{t('orthoAddVisit', 'Add visit')}</button>
      </div>
      {isLoading ? (
        <div className="text-xs text-surface-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" />{t('loading', 'Loading…')}</div>
      ) : !visits || visits.length === 0 ? (
        <p className="text-xs text-surface-400">{t('orthoNoVisits', 'No visits recorded.')}</p>
      ) : (
        <ul className="space-y-1.5">
          {visits.map((v) => (
            <li key={v.id} className="flex items-start gap-3 text-sm">
              <span className="text-surface-500 w-24 shrink-0">{v.visitDate?.split('T')[0]}</span>
              <span className="flex-1 min-w-0 text-surface-700 dark:text-surface-300">
                {[v.changes, v.adjustments].filter(Boolean).join(' · ') || <span className="text-surface-400">{t('orthoVisitNoDetail', 'No detail')}</span>}
                {v.notes && <span className="block text-xs text-surface-400 mt-0.5">{v.notes}</span>}
              </span>
              <button onClick={() => onEdit(v)} className="text-surface-400 hover:text-primary-600 p-0.5"><Pencil size={13} /></button>
              <button onClick={() => handleDelete(v)} className="text-surface-400 hover:text-red-600 p-0.5"><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const OrthoModulePage: React.FC<Props> = ({ patientId, patientName, onBack }) => {
  const { t } = useTranslation();
  const { data: episodes, isLoading } = useListOrthoEpisodesQuery({ patientId });
  const [deleteEpisode] = useDeleteOrthoEpisodeMutation();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [epModalOpen, setEpModalOpen] = useState(false);
  const [editingEp, setEditingEp] = useState<OrthoEpisode | null>(null);
  const [visitModal, setVisitModal] = useState<{ episodeId: string; existing: OrthoVisit | null } | null>(null);

  const openNewEp = () => { setEditingEp(null); setEpModalOpen(true); };
  const openEditEp = (e: OrthoEpisode) => { setEditingEp(e); setEpModalOpen(true); };
  const handleDeleteEp = async (e: OrthoEpisode) => {
    if (!window.confirm(t('orthoEpisodeDeleteConfirm', 'Delete this episode and all its visits?'))) return;
    try { await deleteEpisode(e.id).unwrap(); } catch { /* refetches on success */ }
  };

  const list = episodes ?? [];

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('orthoTitle', 'Orthodontic tracking')}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5"><ChevronLeft size={16} />{t('back', 'Back')}</Button>
        )}
        <Button onClick={openNewEp}><Plus size={18} className="mr-1.5" />{t('orthoEpisodeNewTitle', 'New episode')}</Button>
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
        {patientName && (
          <p className="text-sm text-surface-500">{t('patient', 'Patient')}: <span className="font-medium text-surface-800 dark:text-surface-200">{patientName}</span></p>
        )}

        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-surface-500"><Loader2 size={20} className="animate-spin mr-2" />{t('loading', 'Loading…')}</div>
        ) : list.length === 0 ? (
          <Card className="text-center p-10">
            <Braces size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-surface-500 mb-4">{t('orthoEmpty', 'No orthodontic episodes for this patient yet.')}</p>
            <Button onClick={openNewEp}><Plus size={16} className="mr-1" />{t('orthoStartFirst', 'Start the first episode')}</Button>
          </Card>
        ) : (
          list.map((e) => {
            const isOpen = expanded === e.id;
            return (
              <Card key={e.id}>
                <div className="flex items-start gap-3">
                  <button onClick={() => setExpanded(isOpen ? null : e.id)} className="mt-0.5 text-surface-400 hover:text-surface-700">
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-surface-900 dark:text-white">{e.applianceType || t('orthoUnnamedAppliance', 'Treatment')}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-md', STATUS_TONE[e.status])}>{t(`orthoStatus_${e.status}`, e.status)}</span>
                    </div>
                    <div className="text-xs text-surface-500 mt-0.5">
                      {e.startDate?.split('T')[0]}{e.endDate ? ` – ${e.endDate.split('T')[0]}` : ` – ${t('orthoOngoing', 'ongoing')}`}
                    </div>
                    {e.plan && <p className="text-sm text-surface-600 dark:text-surface-300 mt-1.5 whitespace-pre-wrap">{e.plan}</p>}
                    {e.notes && <p className="text-xs text-surface-400 mt-1">{e.notes}</p>}
                    {isOpen && (
                      <VisitTimeline
                        episodeId={e.id}
                        onEdit={(v) => setVisitModal({ episodeId: e.id, existing: v })}
                        onAdd={() => setVisitModal({ episodeId: e.id, existing: null })}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditEp(e)} className="text-surface-400 hover:text-primary-600 p-1" title={t('edit', 'Edit') as string}><Pencil size={15} /></button>
                    <button onClick={() => handleDeleteEp(e)} className="text-surface-400 hover:text-red-600 p-1" title={t('delete', 'Delete') as string}><Trash2 size={15} /></button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <OrthoEpisodeModal isOpen={epModalOpen} onClose={() => setEpModalOpen(false)} patientId={patientId} existing={editingEp} />
      {visitModal && (
        <OrthoVisitModal
          isOpen
          onClose={() => setVisitModal(null)}
          episodeId={visitModal.episodeId}
          existing={visitModal.existing}
        />
      )}
    </div>
  );
};
