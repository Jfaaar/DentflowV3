import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Building2, FlaskConical, ChevronRight, Pill } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import {
  medicamentsCatalogService,
  type CatalogMedicament,
  type MedicamentGroup,
} from '../../lib/services/medicamentsCatalog';
import { useLanguage } from '../language/LanguageContext';
import { MedicamentDetailsModal } from './MedicamentDetailsModal';

interface Props {
  group: MedicamentGroup | null;
  onClose: () => void;
}

function formatPrice(v: number | null): string {
  if (v == null) return '—';
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} DH`;
}

export const MedicamentVariantsModal: React.FC<Props> = ({ group, onClose }) => {
  const { t } = useLanguage();
  const [variants, setVariants] = useState<CatalogMedicament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CatalogMedicament | null>(null);

  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!group) {
      setVariants([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    medicamentsCatalogService
      .list({ specialite: group.specialite, pageSize: 200 })
      .then((r) => { if (!cancelled) setVariants(r.data); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError((e as { message?: string })?.message || tRef.current('loadMedicamentsFailed'));
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [group]);

  const isOpen = !!group && !selectedDetail;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={group?.specialite ?? ''}
        maxWidth="3xl"
      >
        {group && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {group.laboratoire && (
                <span className="inline-flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                  <Building2 size={14} className="text-surface-400" />
                  {group.laboratoire}
                </span>
              )}
              {group.substanceActive && (
                <span className="inline-flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                  <FlaskConical size={14} className="text-surface-400" />
                  {group.substanceActive}
                </span>
              )}
              <span className="text-xs px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold">
                {t('variantsCount').replace('{count}', String(group.variantCount))}
              </span>
            </div>

            {isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
              </div>
            ) : error ? (
              <div className="py-6 text-center text-red-500 text-sm">{error}</div>
            ) : (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                {variants.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDetail(v)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors flex items-center gap-3"
                    >
                      <Pill size={16} className="text-primary-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                          <span className="font-semibold text-surface-900 dark:text-white">
                            {v.dosage || '—'}
                          </span>
                          {v.forme && (
                            <span className="text-xs text-surface-500">{v.forme}</span>
                          )}
                        </div>
                        {v.presentation && (
                          <div className="text-xs text-surface-500 mt-0.5 truncate">
                            {v.presentation}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-surface-900 dark:text-white">
                          {formatPrice(v.ppv)}
                        </div>
                        {v.statutCommercialisation && (
                          <div className="text-[10px] uppercase tracking-wide text-surface-500 mt-0.5">
                            {v.statutCommercialisation}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-surface-400 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>

      <MedicamentDetailsModal
        id={selectedDetail?.id ?? null}
        initial={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </>
  );
};
