import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Button } from '../../components/ui/Button';
import {
  Loader2, Search, Pill, Building2, FlaskConical, Package, Layers, Beaker, X,
} from 'lucide-react';
import {
  medicamentsCatalogService,
  type CatalogStats,
  type MedicamentGroup,
} from '../../lib/services/medicamentsCatalog';
import { useLanguage } from '../language/LanguageContext';
import { MedicamentVariantsModal } from './MedicamentVariantsModal';

const PAGE_SIZE = 24;

function formatPrice(v: number | null): string {
  if (v == null) return '—';
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} DH`;
}

function priceRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—';
  if (min == null || max == null || min === max) return formatPrice(min ?? max);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

interface StatTileProps {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  accent: string;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, icon, accent }) => (
  <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-surface-500 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
        {value == null ? '—' : value.toLocaleString()}
      </div>
    </div>
  </div>
);

export const MedicamentsCatalogPage: React.FC = () => {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<MedicamentGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [labFilter, setLabFilter] = useState<string>('');
  const [labs, setLabs] = useState<string[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MedicamentGroup | null>(null);

  const tRef = useRef(t);
  tRef.current = t;

  // Stats + lab list — load once on mount; rarely change.
  useEffect(() => {
    let cancelled = false;
    medicamentsCatalogService.getStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch(() => { /* silent — stat tiles fall back to em-dash */ });
    medicamentsCatalogService.listLabs()
      .then((l) => { if (!cancelled) setLabs(l); })
      .catch(() => { /* silent — lab dropdown stays empty */ });
    return () => { cancelled = true; };
  }, []);

  // Debounce the search input.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  // Reset to first page whenever any filter changes.
  useEffect(() => { setPage(0); }, [debouncedSearch, labFilter]);

  const fetchGroups = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const r = await medicamentsCatalogService.listGroups({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        laboratoire: labFilter || undefined,
      });
      if (signal?.aborted) return;
      setGroups(r.data);
      setTotal(r.total);
    } catch (e: unknown) {
      if (signal?.aborted) return;
      const msg = (e as { message?: string })?.message || tRef.current('loadMedicamentsFailed');
      setLoadError(msg);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [page, debouncedSearch, labFilter]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchGroups(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchGroups]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * PAGE_SIZE);

  const hasFilter = !!debouncedSearch || !!labFilter;
  const clearFilters = () => { setSearch(''); setLabFilter(''); };

  const tileData = useMemo(() => ([
    { key: 'totalMedicaments' as const, label: t('statTotalMedicaments'), value: stats?.totalMedicaments ?? null, icon: <Package size={20} className="text-blue-600 dark:text-blue-300" />, accent: 'bg-blue-100 dark:bg-blue-900/30' },
    { key: 'totalBrands' as const, label: t('statTotalBrands'), value: stats?.totalBrands ?? null, icon: <Pill size={20} className="text-primary-600 dark:text-primary-300" />, accent: 'bg-primary-100 dark:bg-primary-900/30' },
    { key: 'totalSubstances' as const, label: t('statTotalSubstances'), value: stats?.totalSubstances ?? null, icon: <FlaskConical size={20} className="text-emerald-600 dark:text-emerald-300" />, accent: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { key: 'totalLabs' as const, label: t('statTotalLabs'), value: stats?.totalLabs ?? null, icon: <Building2 size={20} className="text-amber-600 dark:text-amber-300" />, accent: 'bg-amber-100 dark:bg-amber-900/30' },
  ]), [stats, t]);

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('medicaments')} />

      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tileData.map((tile) => (
              <StatTile key={tile.key} label={tile.label} value={tile.value} icon={tile.icon} accent={tile.accent} />
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
              <input
                type="text"
                placeholder={t('searchByNameOrSubstance')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
              />
            </div>
            <select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm min-w-[180px] cursor-pointer"
            >
              <option value="">{t('allLabs')}</option>
              {labs.map((lab) => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
            {hasFilter && (
              <Button variant="secondary" className="gap-2 text-sm" onClick={clearFilters}>
                <X size={14} /> {t('clearFilters')}
              </Button>
            )}
            <span className="ms-auto text-xs text-surface-500 whitespace-nowrap">
              {t('brandsFound').replace('{count}', total.toLocaleString())}
            </span>
          </div>

          {/* Cards grid */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-primary-500 w-10 h-10" />
            </div>
          ) : loadError ? (
            <div className="py-20 text-center text-red-500">{loadError}</div>
          ) : groups.length === 0 ? (
            <div className="py-20 text-center text-surface-400 italic">
              {hasFilter ? t('noMedicamentsMatch') : t('catalogEmpty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groups.map((g) => {
                const isFullyDiscontinued = g.commercializedCount === 0;
                return (
                  <button
                    key={g.specialite}
                    type="button"
                    onClick={() => setSelected(g)}
                    className="group text-left bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                          <Pill size={16} className="text-primary-600 dark:text-primary-300" />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white truncate" title={g.specialite}>
                          {g.specialite}
                        </h3>
                      </div>
                      {g.variantCount > 1 && (
                        <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 inline-flex items-center gap-1">
                          <Layers size={11} />
                          {g.variantCount}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {g.substanceActive && (
                        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                          <Beaker size={12} className="text-surface-400 shrink-0" />
                          <span className="truncate" title={g.substanceActive}>{g.substanceActive}</span>
                        </div>
                      )}
                      {g.laboratoire && (
                        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                          <Building2 size={12} className="text-surface-400 shrink-0" />
                          <span className="truncate" title={g.laboratoire}>{g.laboratoire}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                      <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
                        {priceRange(g.minPpv, g.maxPpv)}
                      </span>
                      {isFullyDiscontinued ? (
                        <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500">
                          {t('discontinued')}
                        </span>
                      ) : g.variantCount > 1 ? (
                        <span className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('viewVariants')} →
                        </span>
                      ) : (
                        <span className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('viewDetails')} →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 shadow-sm">
              <span className="text-xs text-surface-500">
                {t('showingRange').replace('{from}', String(showingFrom)).replace('{to}', String(showingTo)).replace('{total}', total.toLocaleString())}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  {t('previous')}
                </Button>
                <span className="text-xs text-surface-500 px-2">
                  {t('pageOf').replace('{page}', String(page + 1)).replace('{total}', String(totalPages))}
                </span>
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MedicamentVariantsModal group={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
