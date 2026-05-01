import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Topbar } from '../../components/layout/Topbar';
import { useLanguage } from '../language/LanguageContext';
import { useAuth } from '../auth/useAuth';
import { PermissionGate } from '../../components/auth/PermissionGate';
import { hasPermission } from '../../lib/permissions';
import { clinicalService } from '../../lib/services/clinical';
import type { ClinicalNote, Vitals } from '../../types';
import { Loader2, Lock, Save, FileSignature, Plus, ChevronLeft, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

interface Props {
  patientId: string;
  patientName?: string;
  onBack?: () => void;
}

const blankVitals: Vitals = {};

const blankDraft = (patientId: string, authorId: string, authorName: string, clinicId: string): Partial<ClinicalNote> => ({
  patientId,
  authorId,
  authorName,
  clinicId,
  reason: '',
  symptoms: '',
  diagnosis: '',
  notes: '',
  treatmentPlan: '',
  followUp: '',
  vitals: { ...blankVitals },
});

export const ClinicalNoteEditor: React.FC<Props> = ({ patientId, patientName, onBack }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ClinicalNote> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission(user?.role, 'clinical.edit') || hasPermission(user?.role, 'clinical.create');
  const canSign = hasPermission(user?.role, 'clinical.sign');

  const refresh = async () => {
    setIsLoading(true);
    try {
      const list = await clinicalService.list(patientId);
      setNotes(list);
      if (list.length > 0 && !activeId) setActiveId(list[0].id);
    } catch (e: any) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [patientId]);

  const active = useMemo(
    () => activeId ? notes.find(n => n.id === activeId) : null,
    [activeId, notes]
  );
  const isLocked = !!active?.signedAt;
  const isCreating = !!draft && !draft.id;

  const startNew = () => {
    if (!user) return;
    setActiveId(null);
    setDraft(blankDraft(patientId, user.id, user.name, user.clinicId || ''));
  };

  const cancelDraft = () => {
    setDraft(null);
    if (notes.length > 0) setActiveId(notes[0].id);
  };

  const startEdit = () => {
    if (!active || isLocked) return;
    setDraft({ ...active });
  };

  const handleField = (key: keyof ClinicalNote, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  const handleVitals = (key: keyof Vitals, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, vitals: { ...(draft.vitals ?? {}), [key]: value } });
  };

  const save = async () => {
    if (!draft || !user) return;
    setIsSaving(true);
    setError(null);
    try {
      let saved: ClinicalNote;
      if (draft.id) {
        saved = await clinicalService.update(draft.id, draft);
      } else {
        saved = await clinicalService.create({
          patientId,
          authorId: user.id,
          authorName: user.name,
          clinicId: user.clinicId || '',
          reason: draft.reason,
          symptoms: draft.symptoms,
          diagnosis: draft.diagnosis,
          notes: draft.notes,
          treatmentPlan: draft.treatmentPlan,
          followUp: draft.followUp,
          vitals: draft.vitals,
          appointmentId: draft.appointmentId,
        });
      }
      setDraft(null);
      setActiveId(saved.id);
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const sign = async () => {
    if (!active || !user) return;
    if (!window.confirm(t('confirmSign'))) return;
    setIsSaving(true);
    try {
      await clinicalService.sign(active.id, user.id);
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Sign failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('clinicalNotes')}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ChevronLeft size={16} /> {t('back')}
          </Button>
        )}
        <PermissionGate permission="clinical.create">
          <Button onClick={startNew} className="gap-2">
            <Plus size={16} /> {t('addClinicalNote')}
          </Button>
        </PermissionGate>
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar list */}
          <div className="md:col-span-4 lg:col-span-3 space-y-2">
            <div className="text-xs uppercase font-bold text-surface-500 px-1 mb-2">
              {patientName ?? t('clinicalNotes')}
            </div>
            {isLoading && (
              <div className="flex items-center justify-center p-6 text-surface-400">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {!isLoading && notes.length === 0 && !draft && (
              <Card className="text-sm text-surface-500 italic">{t('noClinicalNotes')}</Card>
            )}
            {notes.map(n => (
              <button
                key={n.id}
                onClick={() => { setDraft(null); setActiveId(n.id); }}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all',
                  activeId === n.id && !draft
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                    : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-primary-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-surface-900 dark:text-white truncate">
                    {n.reason || t('clinicalNote')}
                  </span>
                  {n.signedAt && <Lock size={12} className="text-amber-500 shrink-0" />}
                </div>
                <div className="text-xs text-surface-500 mt-1">
                  {formatDate(new Date(n.createdAt), language)}
                </div>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="md:col-span-8 lg:col-span-9">
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {!draft && active && isLocked && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Lock size={16} />
                <span>
                  {t('noteLockedOn')} {active.signedAt ? formatDate(new Date(active.signedAt), language) : ''}.
                  {' '}{t('noteLockedDescription')}
                </span>
              </div>
            )}

            {!draft && !active && !isLoading && (
              <Card className="text-center text-surface-400">
                {t('selectTooth') /* re-using as a generic 'select' fallback */ }
              </Card>
            )}

            {(draft || active) && (
              <NoteForm
                value={draft ?? active!}
                readOnly={!draft || isLocked}
                onChange={handleField}
                onVitalsChange={handleVitals}
              />
            )}

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              {draft ? (
                <>
                  <Button variant="ghost" onClick={cancelDraft}>{t('cancel')}</Button>
                  <Button onClick={save} isLoading={isSaving} className="gap-2" disabled={!canEdit}>
                    <Save size={16} /> {t('saveDraft')}
                  </Button>
                </>
              ) : active && !isLocked ? (
                <>
                  <PermissionGate permission="clinical.edit">
                    <Button variant="outline" onClick={startEdit}>{t('editClinicalNote')}</Button>
                  </PermissionGate>
                  {canSign && (
                    <Button onClick={sign} isLoading={isSaving} className="gap-2">
                      <FileSignature size={16} /> {t('signNote')}
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reusable note form (renders the same fields in edit + read-only mode).
// ---------------------------------------------------------------------------

interface NoteFormProps {
  value: Partial<ClinicalNote>;
  readOnly: boolean;
  onChange: (key: keyof ClinicalNote, value: any) => void;
  onVitalsChange: (key: keyof Vitals, value: any) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ value, readOnly, onChange, onVitalsChange }) => {
  const { t } = useLanguage();
  return (
    <Card className="space-y-5">
      <Field label={t('reasonForVisit')}>
        <Input value={value.reason ?? ''} onChange={e => onChange('reason', e.target.value)} disabled={readOnly} />
      </Field>
      <Field label={t('symptoms')}>
        <Textarea value={value.symptoms ?? ''} onChange={v => onChange('symptoms', v)} disabled={readOnly} />
      </Field>
      <Field label={t('diagnosis')}>
        <Textarea value={value.diagnosis ?? ''} onChange={v => onChange('diagnosis', v)} disabled={readOnly} />
      </Field>
      <Field label={t('clinicalNotesField')}>
        <Textarea value={value.notes ?? ''} onChange={v => onChange('notes', v)} disabled={readOnly} />
      </Field>
      <Field label={t('treatmentPlan')}>
        <Textarea value={value.treatmentPlan ?? ''} onChange={v => onChange('treatmentPlan', v)} disabled={readOnly} />
      </Field>
      <Field label={t('followUp')}>
        <Textarea value={value.followUp ?? ''} onChange={v => onChange('followUp', v)} disabled={readOnly} />
      </Field>

      <div>
        <h4 className="text-xs font-bold uppercase text-surface-500 mb-3">{t('vitals')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input label={t('bloodPressure')} placeholder="120/80"
            value={value.vitals?.bloodPressure ?? ''}
            onChange={e => onVitalsChange('bloodPressure', e.target.value)}
            disabled={readOnly} />
          <Input label={t('heartRate')} placeholder="72" type="number"
            value={value.vitals?.heartRate ?? ''}
            onChange={e => onVitalsChange('heartRate', e.target.value ? Number(e.target.value) : undefined)}
            disabled={readOnly} />
          <Input label={t('temperature')} placeholder="36.6" type="number" step="0.1"
            value={value.vitals?.temperature ?? ''}
            onChange={e => onVitalsChange('temperature', e.target.value ? Number(e.target.value) : undefined)}
            disabled={readOnly} />
          <Input label={t('weight')} placeholder="70" type="number" step="0.1"
            value={value.vitals?.weight ?? ''}
            onChange={e => onVitalsChange('weight', e.target.value ? Number(e.target.value) : undefined)}
            disabled={readOnly} />
          <Input label={t('height')} placeholder="170" type="number"
            value={value.vitals?.height ?? ''}
            onChange={e => onVitalsChange('height', e.target.value ? Number(e.target.value) : undefined)}
            disabled={readOnly} />
        </div>
      </div>
    </Card>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase text-surface-500 tracking-wide">{label}</label>
    {children}
  </div>
);

const Textarea: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className="w-full min-h-[90px] p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:bg-surface-50 dark:disabled:bg-surface-800/50 resize-y"
  />
);
