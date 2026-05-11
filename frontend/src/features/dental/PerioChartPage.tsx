// Periodontal charting — patient-scoped page mounted at
// /app/patients/:patientId/perio (gated by the perioChart feature).
//
// A "chart" is one probing session; each tooth has up to 6 site readings
// (buccal/lingual × mesial/mid/distal): pocket depth, recession, bleeding
// on probing, suppuration — plus tooth-level mobility and furcation. The
// arch grid colour-codes pocket depths (≤3 green, 4-5 amber, ≥6 red);
// clicking a tooth opens an inline editor for its six sites.
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Plus, Save, Trash2, Loader2, Stethoscope, Droplet,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  useListPerioChartsQuery,
  useGetPerioChartQuery,
  useCreatePerioChartMutation,
  useReplacePerioSitesMutation,
  useDeletePerioChartMutation,
  type PerioSite,
  type PerioPosition,
} from './api/perioApi';
import {
  UPPER_TEETH, LOWER_TEETH, BUCCAL_POSITIONS, LINGUAL_POSITIONS, POSITIONS,
  POSITION_LABEL, pdSeverityClass, pdSeverityBg,
  emptyToothMap, type ToothMap, type SiteData,
} from './perioConstants';

interface Props {
  patientId: string;
  patientName?: string;
  onBack?: () => void;
}

const MOBILITY_OPTS = [null, 0, 1, 2, 3] as const;
const FURCATION_OPTS = [null, 0, 1, 2, 3, 4] as const;
const PD_OPTS: Array<number | null> = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const REC_OPTS: Array<number | null> = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8];

function chartSitesToMap(sites: PerioSite[]): ToothMap {
  const m = emptyToothMap();
  for (const s of sites) {
    if (!m[s.tooth]) m[s.tooth] = { sites: {} };
    m[s.tooth].sites[s.position] = {
      pocketDepthMm: s.pocketDepthMm ?? null,
      recessionMm: s.recessionMm ?? null,
      bleedingOnProbing: s.bleedingOnProbing === true,
      suppuration: s.suppuration === true,
    };
    // mobility / furcation are stored per-row but are tooth-level; first
    // non-null wins.
    if (s.mobility != null && m[s.tooth].mobility == null) m[s.tooth].mobility = s.mobility;
    if (s.furcation != null && m[s.tooth].furcation == null) m[s.tooth].furcation = s.furcation;
  }
  return m;
}

function mapToChartSites(m: ToothMap): PerioSite[] {
  const out: PerioSite[] = [];
  for (const [tooth, td] of Object.entries(m)) {
    const positions = Object.keys(td.sites) as PerioPosition[];
    // If the tooth has mobility/furcation but no probed sites, anchor it on
    // buccal_mid so the data isn't lost.
    const anchored = positions.length === 0 && (td.mobility != null || td.furcation != null)
      ? (['buccal_mid'] as PerioPosition[])
      : positions;
    for (const pos of anchored) {
      const sd = td.sites[pos] ?? {};
      out.push({
        tooth,
        position: pos,
        pocketDepthMm: sd.pocketDepthMm ?? null,
        recessionMm: sd.recessionMm ?? null,
        bleedingOnProbing: sd.bleedingOnProbing === true,
        suppuration: sd.suppuration === true,
        mobility: td.mobility ?? null,
        furcation: td.furcation ?? null,
      });
    }
  }
  return out;
}

const SmallSelect: React.FC<{
  value: number | null | undefined;
  options: ReadonlyArray<number | null>;
  onChange: (v: number | null) => void;
  ariaLabel: string;
}> = ({ value, options, onChange, ariaLabel }) => (
  <select
    aria-label={ariaLabel}
    value={value == null ? '' : String(value)}
    onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    className="rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-1.5 py-1 text-xs w-14"
  >
    {options.map((o) => (
      <option key={o == null ? 'none' : o} value={o == null ? '' : String(o)}>{o == null ? '–' : o}</option>
    ))}
  </select>
);

export const PerioChartPage: React.FC<Props> = ({ patientId, patientName, onBack }) => {
  const { t } = useTranslation();
  const { data: chartList, isLoading: loadingList } = useListPerioChartsQuery({ patientId, pageSize: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (chartList && chartList.data.length > 0 && selectedId == null) {
      setSelectedId(chartList.data[0].id);
    }
  }, [chartList, selectedId]);

  const { data: chart, isFetching: loadingChart } = useGetPerioChartQuery(selectedId as string, { skip: !selectedId });
  const [createChart, { isLoading: creating }] = useCreatePerioChartMutation();
  const [replaceSites, { isLoading: saving }] = useReplacePerioSitesMutation();
  const [deleteChart, { isLoading: deleting }] = useDeletePerioChartMutation();

  const [toothMap, setToothMap] = useState<ToothMap>(() => emptyToothMap());
  const [dirty, setDirty] = useState(false);
  const [openTooth, setOpenTooth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the local map whenever a chart loads (and we have no unsaved edits).
  useEffect(() => {
    if (chart && !dirty) {
      setToothMap(chartSitesToMap(chart.sites));
      setOpenTooth(null);
    }
  }, [chart, dirty]);

  const mutate = (fn: (m: ToothMap) => void) => {
    setToothMap((prev) => {
      const next: ToothMap = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const setSite = (tooth: string, pos: PerioPosition, patch: Partial<SiteData>) =>
    mutate((m) => {
      if (!m[tooth]) m[tooth] = { sites: {} };
      m[tooth].sites[pos] = { ...(m[tooth].sites[pos] ?? {}), ...patch };
    });
  const setToothLevel = (tooth: string, patch: { mobility?: number | null; furcation?: number | null }) =>
    mutate((m) => {
      if (!m[tooth]) m[tooth] = { sites: {} };
      Object.assign(m[tooth], patch);
    });

  const handleNewChart = async () => {
    setError(null);
    try {
      const created = await createChart({ patientId }).unwrap();
      setSelectedId(created.id);
      setToothMap(emptyToothMap());
      setDirty(false);
      setOpenTooth(null);
    } catch (e: unknown) {
      setError(extractMsg(e) ?? t('perioCreateFailed', 'Failed to start a new chart'));
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await replaceSites({ id: selectedId, sites: mapToChartSites(toothMap) }).unwrap();
      setDirty(false);
    } catch (e: unknown) {
      setError(extractMsg(e) ?? t('perioSaveFailed', 'Failed to save the chart'));
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm(t('perioDeleteConfirm', 'Delete this perio chart?'))) return;
    try {
      await deleteChart(selectedId).unwrap();
      setSelectedId(null);
      setToothMap(emptyToothMap());
      setDirty(false);
    } catch (e: unknown) {
      setError(extractMsg(e) ?? t('perioDeleteFailed', 'Failed to delete the chart'));
    }
  };

  const bopCount = useMemo(() => {
    let n = 0; let total = 0;
    for (const td of Object.values(toothMap)) {
      for (const sd of Object.values(td.sites)) { total += 1; if (sd?.bleedingOnProbing) n += 1; }
    }
    return { n, total };
  }, [toothMap]);

  const hasCharts = (chartList?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('perioTitle', 'Periodontal chart')}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ChevronLeft size={16} />{t('back', 'Back')}
          </Button>
        )}
        {hasCharts && (
          <select
            value={selectedId ?? ''}
            onChange={(e) => { setSelectedId(e.target.value || null); setDirty(false); }}
            className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 text-sm"
          >
            {chartList!.data.map((c) => (
              <option key={c.id} value={c.id}>{new Date(c.chartedAt).toLocaleDateString()}</option>
            ))}
          </select>
        )}
        <Button variant="outline" size="sm" onClick={handleNewChart} isLoading={creating}>
          <Plus size={16} className="mr-1" />{t('perioNewChart', 'New chart')}
        </Button>
        {selectedId && (
          <>
            <Button size="sm" onClick={handleSave} isLoading={saving} disabled={!dirty}>
              <Save size={16} className="mr-1" />{dirty ? t('save', 'Save') : t('saved', 'Saved')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} isLoading={deleting} className="text-red-600">
              <Trash2 size={16} />
            </Button>
          </>
        )}
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
        {patientName && (
          <p className="text-sm text-surface-500">{t('patient', 'Patient')}: <span className="font-medium text-surface-800 dark:text-surface-200">{patientName}</span></p>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>
        )}

        {loadingList ? (
          <div className="p-10 flex items-center justify-center text-surface-500">
            <Loader2 size={20} className="animate-spin mr-2" />{t('loading', 'Loading…')}
          </div>
        ) : !hasCharts && !selectedId ? (
          <Card className="text-center p-10">
            <Stethoscope size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-surface-500 mb-4">{t('perioEmpty', 'No periodontal charts for this patient yet.')}</p>
            <Button onClick={handleNewChart} isLoading={creating}>
              <Plus size={16} className="mr-1" />{t('perioStartFirst', 'Start the first chart')}
            </Button>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
              {loadingChart && <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" />{t('loading', 'Loading…')}</span>}
              <span className="flex items-center gap-1"><Droplet size={12} className="text-red-500" />{t('perioBopSummary', 'Bleeding on probing')}: {bopCount.n}/{bopCount.total || 0}</span>
              {dirty && <span className="text-amber-600 dark:text-amber-400">{t('unsavedChanges', 'Unsaved changes')}</span>}
            </div>

            {/* Arches */}
            <ArchRow title={t('perioUpperArch', 'Upper arch')} teeth={UPPER_TEETH} toothMap={toothMap} openTooth={openTooth} onOpen={setOpenTooth} />
            <ArchRow title={t('perioLowerArch', 'Lower arch')} teeth={LOWER_TEETH} toothMap={toothMap} openTooth={openTooth} onOpen={setOpenTooth} />

            {/* Per-tooth editor */}
            {openTooth && (
              <ToothEditor
                tooth={openTooth}
                data={toothMap[openTooth] ?? { sites: {} }}
                onSite={(pos, patch) => setSite(openTooth, pos, patch)}
                onToothLevel={(patch) => setToothLevel(openTooth, patch)}
                onClose={() => setOpenTooth(null)}
              />
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-surface-500 pt-1">
              <span className={cn('px-1.5 rounded', pdSeverityBg(2))}>≤3 mm</span>
              <span className={cn('px-1.5 rounded', pdSeverityBg(4))}>4–5 mm</span>
              <span className={cn('px-1.5 rounded', pdSeverityBg(6))}>≥6 mm</span>
              <span className="flex items-center gap-1"><Droplet size={11} className="text-red-500" />= BoP</span>
              <span>M = mobility</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Arch row ────────────────────────────────────────────────────────────────
const ArchRow: React.FC<{
  title: string;
  teeth: string[];
  toothMap: ToothMap;
  openTooth: string | null;
  onOpen: (t: string | null) => void;
}> = ({ title, teeth, toothMap, openTooth, onOpen }) => (
  <Card className="p-3 overflow-x-auto">
    <div className="text-xs uppercase tracking-wide text-surface-400 mb-2">{title}</div>
    <div className="flex gap-1.5 min-w-max">
      {teeth.map((tn) => (
        <ToothCard key={tn} tooth={tn} data={toothMap[tn] ?? { sites: {} }} active={openTooth === tn} onClick={() => onOpen(openTooth === tn ? null : tn)} />
      ))}
    </div>
  </Card>
);

// ── Tooth card (mini 2×3 PD grid + BoP dots + mobility badge) ───────────────
const ToothCard: React.FC<{ tooth: string; data: { sites: Record<string, SiteData | undefined>; mobility?: number | null }; active: boolean; onClick: () => void }> = ({ tooth, data, active, onClick }) => {
  const cell = (pos: PerioPosition) => {
    const sd = data.sites[pos];
    const pd = sd?.pocketDepthMm ?? null;
    return (
      <div key={pos} className={cn('relative w-6 h-5 flex items-center justify-center text-[10px] leading-none', pdSeverityBg(pd), pdSeverityClass(pd))}>
        {pd == null ? '·' : pd}
        {sd?.bleedingOnProbing && <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden />}
        {sd?.suppuration && <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-yellow-400" aria-hidden />}
      </div>
    );
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center rounded-md border p-1 transition-colors shrink-0',
        active ? 'border-primary-500 ring-1 ring-primary-300' : 'border-surface-200 dark:border-surface-700 hover:border-primary-300',
      )}
      title={`${tooth}`}
    >
      <span className="text-[10px] text-surface-500 mb-0.5">{tooth}</span>
      <div className="flex gap-px">{BUCCAL_POSITIONS.map(cell)}</div>
      <div className="flex gap-px mt-px">{LINGUAL_POSITIONS.map(cell)}</div>
      <span className="text-[9px] text-surface-400 mt-0.5 h-3">{data.mobility != null ? `M${data.mobility}` : ''}</span>
    </button>
  );
};

// ── Per-tooth editor ────────────────────────────────────────────────────────
const ToothEditor: React.FC<{
  tooth: string;
  data: { sites: Partial<Record<PerioPosition, SiteData>>; mobility?: number | null; furcation?: number | null };
  onSite: (pos: PerioPosition, patch: Partial<SiteData>) => void;
  onToothLevel: (patch: { mobility?: number | null; furcation?: number | null }) => void;
  onClose: () => void;
}> = ({ tooth, data, onSite, onToothLevel, onClose }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{t('perioTooth', 'Tooth')} {tooth}</h3>
        <button onClick={onClose} className="text-sm text-surface-400 hover:text-surface-700">{t('close', 'Close')}</button>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm w-full min-w-[480px]">
          <thead className="text-xs text-surface-500">
            <tr>
              <th className="text-start font-medium py-1">{t('perioSite', 'Site')}</th>
              <th className="font-medium py-1">PD</th>
              <th className="font-medium py-1">{t('perioRecession', 'Recession')}</th>
              <th className="font-medium py-1">BoP</th>
              <th className="font-medium py-1">{t('perioSuppuration', 'Suppuration')}</th>
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map((pos) => {
              const sd = data.sites[pos] ?? {};
              return (
                <tr key={pos} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="py-1.5 text-surface-700 dark:text-surface-300">{POSITION_LABEL[pos]}</td>
                  <td className="py-1.5 text-center"><SmallSelect ariaLabel={`PD ${pos}`} value={sd.pocketDepthMm} options={PD_OPTS} onChange={(v) => onSite(pos, { pocketDepthMm: v })} /></td>
                  <td className="py-1.5 text-center"><SmallSelect ariaLabel={`Recession ${pos}`} value={sd.recessionMm} options={REC_OPTS} onChange={(v) => onSite(pos, { recessionMm: v })} /></td>
                  <td className="py-1.5 text-center"><input type="checkbox" checked={sd.bleedingOnProbing === true} onChange={(e) => onSite(pos, { bleedingOnProbing: e.target.checked })} className="rounded border-surface-300 text-red-600 focus:ring-red-500" /></td>
                  <td className="py-1.5 text-center"><input type="checkbox" checked={sd.suppuration === true} onChange={(e) => onSite(pos, { suppuration: e.target.checked })} className="rounded border-surface-300 text-yellow-600 focus:ring-yellow-500" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-6 mt-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-surface-500">{t('perioMobility', 'Mobility')}</span>
          <SmallSelect ariaLabel="Mobility" value={data.mobility} options={MOBILITY_OPTS} onChange={(v) => onToothLevel({ mobility: v })} />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-surface-500">{t('perioFurcation', 'Furcation')}</span>
          <SmallSelect ariaLabel="Furcation" value={data.furcation} options={FURCATION_OPTS} onChange={(v) => onToothLevel({ furcation: v })} />
        </label>
      </div>
    </Card>
  );
};

function extractMsg(e: unknown): string | undefined {
  return (e as { data?: { error?: { message?: string } } })?.data?.error?.message;
}
