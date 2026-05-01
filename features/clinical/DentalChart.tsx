import React, { useEffect, useMemo, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useLanguage } from '../language/LanguageContext';
import { useAuth } from '../auth/useAuth';
import { PermissionGate } from '../../components/auth/PermissionGate';
import { hasPermission } from '../../lib/permissions';
import { dentalChartService } from '../../lib/services/dentalChart';
import type { DentalChartEntry, ToothCondition } from '../../types';
import { Loader2, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

// FDI two rows (per spec):
//   top:    18..11, 21..28
//   bottom: 48..41, 31..38
const TOP_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const BOTTOM_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CONDITION_COLORS: Record<ToothCondition, string> = {
  healthy: 'bg-emerald-500',
  caries: 'bg-red-500',
  filling: 'bg-blue-500',
  crown: 'bg-amber-500',
  extraction: 'bg-rose-700',
  implant: 'bg-purple-500',
  rootCanal: 'bg-indigo-500',
  missing: 'bg-surface-500',
  fracture: 'bg-orange-500',
  other: 'bg-pink-500',
};

const CONDITIONS: ToothCondition[] = [
  'healthy', 'caries', 'filling', 'crown', 'extraction',
  'implant', 'rootCanal', 'missing', 'fracture', 'other',
];

interface Props {
  patientId: string;
  patientName?: string;
  onBack?: () => void;
}

export const DentalChart: React.FC<Props> = ({ patientId, patientName, onBack }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<DentalChartEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const canEdit = hasPermission(user?.role, 'dentalChart.edit');

  const refresh = async () => {
    setIsLoading(true);
    try {
      setEntries(await dentalChartService.list(patientId));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [patientId]);

  const dominantByTooth = useMemo(() => {
    const m = new Map<string, ToothCondition>();
    // Latest entry per tooth wins (entries are sorted desc).
    entries.forEach(e => { if (!m.has(e.toothId)) m.set(e.toothId, e.condition); });
    return m;
  }, [entries]);

  const Tooth: React.FC<{ id: number }> = ({ id }) => {
    const dom = dominantByTooth.get(String(id));
    return (
      <button
        onClick={() => setActiveTooth(String(id))}
        className={cn(
          'relative w-9 h-12 md:w-11 md:h-14 rounded-md border-2 transition-all flex flex-col items-center justify-end p-1 group',
          'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-primary-400 hover:shadow-md'
        )}
        title={`Tooth ${id}`}
      >
        {dom && (
          <span className={cn('absolute top-0.5 right-0.5 w-2 h-2 rounded-full', CONDITION_COLORS[dom])} />
        )}
        <span className="text-[10px] md:text-xs font-bold text-surface-700 dark:text-surface-300 group-hover:text-primary-600">
          {id}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('dentalChartTitle')}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ChevronLeft size={16} /> {t('back')}
          </Button>
        )}
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <div className="text-xs uppercase font-bold text-surface-500 mb-2">{patientName ?? ''}</div>
            {isLoading && (
              <div className="flex items-center justify-center p-6 text-surface-400"><Loader2 className="animate-spin" /></div>
            )}
            {!isLoading && (
              <div className="flex flex-col items-center gap-6">
                {/* Upper jaw */}
                <div>
                  <div className="text-[11px] font-bold text-surface-500 uppercase text-center mb-2">{t('upperJaw')}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {TOP_ROW.map(id => <Tooth key={id} id={id} />)}
                  </div>
                </div>
                {/* Lower jaw */}
                <div>
                  <div className="text-[11px] font-bold text-surface-500 uppercase text-center mb-2">{t('lowerJaw')}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {BOTTOM_ROW.map(id => <Tooth key={id} id={id} />)}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Legend */}
          <Card>
            <div className="text-xs uppercase font-bold text-surface-500 mb-3">{t('condition')}</div>
            <div className="flex flex-wrap gap-3">
              {CONDITIONS.map(c => (
                <div key={c} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300">
                  <span className={cn('w-3 h-3 rounded-full', CONDITION_COLORS[c])} />
                  {t(`cond_${c}` as any)}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {activeTooth && (
        <ToothModal
          toothId={activeTooth}
          patientId={patientId}
          clinicId={user?.clinicId || ''}
          authorId={user?.id || ''}
          entries={entries.filter(e => e.toothId === activeTooth)}
          canEdit={canEdit}
          onClose={() => setActiveTooth(null)}
          onChanged={refresh}
          language={language}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

interface ToothModalProps {
  toothId: string;
  patientId: string;
  clinicId: string;
  authorId: string;
  entries: DentalChartEntry[];
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void;
  language: string;
}

const ToothModal: React.FC<ToothModalProps> = ({
  toothId, patientId, clinicId, authorId, entries, canEdit, onClose, onChanged, language,
}) => {
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [condition, setCondition] = useState<ToothCondition>('caries');
  const [surface, setSurface] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    setBusy(true);
    try {
      await dentalChartService.upsert({
        patientId, toothId, condition, surface, note,
        clinicId, authorId,
      });
      setAdding(false);
      setCondition('caries');
      setSurface('');
      setNote('');
      onChanged();
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(t('confirm'))) return;
    setBusy(true);
    try {
      await dentalChartService.remove(id);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`${t('toothFindings')} ${toothId}`} maxWidth="lg">
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-sm italic text-surface-500">{t('noChartEntries')}</div>
        ) : (
          <ul className="space-y-2">
            {entries.map(e => (
              <li key={e.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-3 h-3 rounded-full', CONDITION_COLORS[e.condition])} />
                    <span className="text-sm font-bold text-surface-900 dark:text-white">
                      {t(`cond_${e.condition}` as any)}
                    </span>
                    {e.surface && <span className="text-xs bg-surface-100 dark:bg-surface-900 px-2 py-0.5 rounded text-surface-500">{e.surface}</span>}
                  </div>
                  {e.note && <div className="text-xs text-surface-500 mt-1">{e.note}</div>}
                  <div className="text-[10px] text-surface-400 mt-1">{formatDate(new Date(e.createdAt), language)}</div>
                </div>
                <PermissionGate permission="dentalChart.edit">
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </PermissionGate>
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          adding ? (
            <div className="space-y-3 border-t border-surface-200 dark:border-surface-700 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-surface-500 mb-2">{t('condition')}</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all flex items-center gap-2',
                        condition === c
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300'
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full', CONDITION_COLORS[c])} />
                      {t(`cond_${c}` as any)}
                    </button>
                  ))}
                </div>
              </div>
              <Input label={t('surface')} placeholder="M / D / O / B / L"
                value={surface} onChange={e => setSurface(e.target.value)} />
              <div>
                <label className="block text-xs font-bold uppercase text-surface-500 mb-1.5">{t('notes')}</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>{t('cancel')}</Button>
                <Button onClick={handleAdd} isLoading={busy}>{t('addFinding')}</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setAdding(true)} className="w-full gap-2">
              <Plus size={16} /> {t('addFinding')}
            </Button>
          )
        )}
      </div>
    </Modal>
  );
};
