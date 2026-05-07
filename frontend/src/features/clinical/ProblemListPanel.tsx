import React, { useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  useListProblemsQuery,
  useCreateProblemMutation,
  useUpdateProblemMutation,
  useDeleteProblemMutation,
  type Problem,
  type ProblemStatus,
} from './api/medicalApi';
import icd10 from '../../lib/icd10/common.json';

interface Props {
  patientId: string;
}

interface IcdEntry {
  code: string;
  label: string;
}

const STATUSES: ProblemStatus[] = ['active', 'chronic', 'resolved', 'inactive'];

export const ProblemListPanel: React.FC<Props> = ({ patientId }) => {
  const { t } = useTranslation();
  const { data } = useListProblemsQuery({ patientId, pageSize: 200 });
  const [createProblem, { isLoading: isCreating }] = useCreateProblemMutation();
  const [updateProblem] = useUpdateProblemMutation();
  const [deleteProblem] = useDeleteProblemMutation();

  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProblemStatus>('active');

  const matches = useMemo<IcdEntry[]>(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return (icd10 as IcdEntry[])
      .filter((i) => i.code.toLowerCase().includes(q) || i.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search]);

  const reset = () => {
    setAdding(false);
    setSearch('');
    setCode('');
    setLabel('');
    setDescription('');
    setStatus('active');
  };

  const handleAdd = async () => {
    if (!code && !description) return;
    await createProblem({
      patientId,
      icd10Code: code || undefined,
      icd10Label: label || undefined,
      description: description || undefined,
      status,
    }).unwrap();
    reset();
  };

  const setProblemStatus = (p: Problem, next: ProblemStatus) => {
    const patch: Partial<Problem> = { status: next };
    if (next === 'resolved' && !p.resolvedDate) {
      patch.resolvedDate = new Date().toISOString().slice(0, 10);
    }
    updateProblem({ id: p.id, patch });
  };

  const problems = data?.data ?? [];
  const active = problems.filter((p) => p.status === 'active' || p.status === 'chronic');
  const inactive = problems.filter((p) => p.status === 'resolved' || p.status === 'inactive');

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600">
            <ClipboardList size={20} />
          </div>
          <h3 className="text-lg font-semibold">{t('problemList', 'Problem list')}</h3>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} className="mr-1" /> {t('addProblem', 'Add problem')}
          </Button>
        )}
      </div>

      {adding && (
        <div className="space-y-3 p-4 mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/40">
          <div className="relative">
            <Input
              label={t('icd10Search', 'Search ICD-10')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('icd10SearchPlaceholder', 'e.g. hypertension or I10')}
            />
            {matches.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-lg">
                {matches.map((m) => (
                  <li
                    key={m.code}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    onClick={() => {
                      setCode(m.code);
                      setLabel(m.label);
                      setSearch(`${m.code} — ${m.label}`);
                    }}
                  >
                    <span className="font-mono mr-2 text-primary-600">{m.code}</span>
                    {m.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Input
            label={t('description', 'Description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('problemDescriptionPlaceholder', 'Free-text description (used if no ICD-10 code)')}
          />
          <div>
            <label className="block text-xs font-bold uppercase text-surface-500 mb-1">{t('status', 'Status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProblemStatus)}
              className="w-full rounded-xl border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 py-2 px-3 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`problemStatus_${s}`, s)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>{t('cancel', 'Cancel')}</Button>
            <Button onClick={handleAdd} isLoading={isCreating} disabled={!code && !description}>
              {t('save', 'Save')}
            </Button>
          </div>
        </div>
      )}

      <ProblemSection title={t('problemActive', 'Active & chronic')} items={active} onStatus={setProblemStatus} onDelete={(id) => deleteProblem(id)} />
      {inactive.length > 0 && (
        <div className="mt-6">
          <ProblemSection title={t('problemResolved', 'Resolved & inactive')} items={inactive} onStatus={setProblemStatus} onDelete={(id) => deleteProblem(id)} />
        </div>
      )}
      {problems.length === 0 && !adding && (
        <p className="text-sm text-surface-500 italic">{t('problemEmpty', 'No problems recorded.')}</p>
      )}
    </Card>
  );
};

interface SectionProps {
  title: string;
  items: Problem[];
  onStatus: (p: Problem, next: ProblemStatus) => void;
  onDelete: (id: string) => void;
}

const ProblemSection: React.FC<SectionProps> = ({ title, items, onStatus, onDelete }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs uppercase font-bold text-surface-500 mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {p.icd10Code && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {p.icd10Code}
                  </span>
                )}
                <span className="text-sm font-medium">{p.icd10Label || p.description}</span>
              </div>
              {p.icd10Label && p.description && (
                <p className="text-xs text-surface-500 mt-1">{p.description}</p>
              )}
              {p.onsetDate && (
                <p className="text-xs text-surface-500 mt-1">
                  {t('onset', 'Onset')}: {p.onsetDate}
                </p>
              )}
            </div>
            <select
              value={p.status}
              onChange={(e) => onStatus(p, e.target.value as ProblemStatus)}
              className="text-xs rounded-md border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`problemStatus_${s}`, s)}</option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm(t('confirmDelete', 'Delete this entry?'))) onDelete(p.id);
              }}
              aria-label={t('delete', 'Delete')}
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
