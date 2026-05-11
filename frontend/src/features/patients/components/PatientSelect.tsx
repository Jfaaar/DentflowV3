// Reusable patient autocomplete. Used by treatment-plan creation and the
// walk-in modal in the waiting room.
import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { patientsService } from '../../../lib/services/patients';
import type { Patient } from '../../../types';
import { cn } from '../../../lib/utils';
import { useLanguage } from '../../language/LanguageContext';

interface PatientSelectProps {
  value: Patient | null;
  onChange: (p: Patient | null) => void;
  label?: string;
}

export const PatientSelect: React.FC<PatientSelectProps> = ({ value, onChange, label }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!open) return;
    setLoading(true);
    const id = window.setTimeout(async () => {
      try {
        const r = await patientsService.list({ search: query || undefined, pageSize: 10 });
        if (!cancelled) setResults(r.data);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query, open]);

  return (
    <div className="relative">
      <label className="block text-xs font-bold uppercase text-surface-500 mb-1.5 tracking-wider">
        {label ?? t('patient' as any) ?? 'Patient'}
      </label>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-3 h-11 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-start"
      >
        <span className={cn(value ? 'text-surface-900 dark:text-white' : 'text-surface-400')}>
          {value?.name || t('selectPatient' as any) || 'Select patient'}
        </span>
        <ChevronDown
          size={16}
          className={cn('text-surface-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-elevated overflow-hidden">
          <div className="p-2 border-b border-surface-200 dark:border-surface-800">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPatients' as any) || 'Search patients…'}
              className="w-full px-3 h-9 rounded-lg bg-surface-50 dark:bg-surface-800 border border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <div className="px-3 py-4 text-center text-surface-400 text-sm">
                <Loader2 className="inline-block animate-spin" size={14} />
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-3 py-4 text-center text-surface-400 text-sm italic">
                {t('noResults' as any) || 'No results'}
              </div>
            )}
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800',
                  value?.id === p.id && 'bg-primary-50 dark:bg-primary-900/20',
                )}
              >
                <div className="font-medium text-surface-900 dark:text-white">{p.name}</div>
                {p.phone && <div className="text-xs text-surface-500">{p.phone}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
