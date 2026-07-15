import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Pill, Building2, FlaskConical, ExternalLink } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import {
  medicamentsCatalogService,
  type CatalogMedicament,
} from '../../lib/services/medicamentsCatalog';
import { useLanguage } from '../language/LanguageContext';

interface Props {
  id: string | null;
  initial?: CatalogMedicament | null;
  onClose: () => void;
}

function formatPrice(v: number | null): string {
  if (v == null) return '—';
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} DH`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-xs uppercase tracking-wide font-semibold text-surface-500 dark:text-surface-400 mb-1">{label}</div>
    <div className="text-sm text-surface-900 dark:text-surface-100 break-words">{children ?? '—'}</div>
  </div>
);

export const MedicamentDetailsModal: React.FC<Props> = ({ id, initial, onClose }) => {
  const { t } = useLanguage();
  const [med, setMed] = useState<CatalogMedicament | null>(initial ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useLanguage() returns a fresh `t` each render — keep it in a ref so this
  // effect only re-runs when the medicament id actually changes.
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    medicamentsCatalogService.get(id)
      .then((data) => { if (!cancelled) setMed(data); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError((e as { message?: string })?.message || tRef.current('loadMedicamentsFailed'));
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <Modal isOpen={!!id} onClose={onClose} title={t('medicamentDetails')} maxWidth="3xl">
      {isLoading && !med ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary-500 w-10 h-10" />
        </div>
      ) : error ? (
        <div className="py-10 text-center text-red-500">{error}</div>
      ) : med ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Pill className="text-primary-500 shrink-0 mt-1" size={22} />
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-surface-900 dark:text-white">{med.specialite}</div>
              {med.presentation && (
                <div className="text-sm text-surface-500 mt-0.5">{med.presentation}</div>
              )}
            </div>
            {med.statutCommercialisation && (
              <span className="text-xs px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
                {med.statutCommercialisation}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-surface-100 dark:border-surface-800 pt-5">
            <Field label={t('detailDosage')}>{med.dosage}</Field>
            <Field label={t('detailForme')}>{med.forme}</Field>
            <Field label={t('detailPresentation')}>{med.presentation}</Field>
            <Field label={t('detailPpGn')}>{med.ppGn}</Field>

            <Field label={t('detailSubstance')}>
              {med.substanceActive ? (
                <span className="inline-flex items-center gap-1.5">
                  <FlaskConical size={14} className="text-surface-400" />
                  {med.substanceActive}
                </span>
              ) : null}
            </Field>
            <Field label={t('detailClasseTher')}>{med.classeTherapeutique}</Field>
            <Field label={t('detailLab')}>
              {med.laboratoire ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className="text-surface-400" />
                  {med.laboratoire}
                </span>
              ) : null}
            </Field>
            <Field label={t('detailStatutAmm')}>{med.statutAmm}</Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-50 dark:bg-surface-800/40 rounded-xl px-4 py-4">
            <Field label={t('detailPpv')}>
              <span className="font-semibold">{formatPrice(med.ppv)}</span>
            </Field>
            <Field label={t('detailPh')}>{formatPrice(med.ph)}</Field>
            <Field label={t('detailPfht')}>{formatPrice(med.pfht)}</Field>
            <Field label={t('detailTva')}>
              {med.tva == null ? '—' : `${med.tva.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-surface-100 dark:border-surface-800 pt-5">
            <Field label={t('detailLastSynced')}>{formatDateTime(med.lastSyncedAt)}</Field>
            <Field label={t('detailSource')}>
              {med.sourceUrl && /^https?:\/\//i.test(med.sourceUrl) ? (
                <a
                  href={med.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline break-all"
                >
                  <ExternalLink size={14} className="shrink-0" />
                  <span className="truncate">{med.sourceUrl}</span>
                </a>
              ) : (
                <span className="text-surface-500">{med.sourceUrl || '—'}</span>
              )}
            </Field>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
