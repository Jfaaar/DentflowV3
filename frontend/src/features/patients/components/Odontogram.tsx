// FDI dental chart (odontogram). Two views:
//   • Clinical — the classic 5-surface tooth box (centre + 4 trapezoids:
//     occlusal/incisal · vestibular · palatal/lingual · mesial · distal),
//     each surface coloured by its treatment status.
//   • Anatomical — simplified tooth silhouettes, coloured per tooth.
//
// Adult (permanent) or child (deciduous) dentition. Clicking a tooth selects
// it and opens a side panel listing that tooth's treatments, with an
// "add treatment" action and per-surface shortcuts. Clicking a surface in the
// clinical view both selects the tooth and pre-fills that surface.
//
// Props are unchanged from the previous version so call sites need no edits.
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';
import { Treatment } from '../../../types';
import { Grid3x3, Layers, Baby, User, Plus, X, CircleDot } from 'lucide-react';

interface OdontogramProps {
  treatments: Treatment[];
  onToothClick: (toothId: string, surface?: string) => void;
}

type ViewMode = 'clinical' | 'anatomical';
type DentitionType = 'adult' | 'child';
type VisualPart = 'center' | 'top' | 'bottom' | 'left' | 'right';
type Status = 'planned' | 'completed' | 'mixed';

// ─── FDI quadrant data ──────────────────────────────────────────────────────
// Each quadrant lists teeth in the order they read on the chart (towards the
// midline → away). `corner` tells the layout where the quadrant sits.
const ADULT_QUADRANTS = [
  { id: 1, teeth: [18, 17, 16, 15, 14, 13, 12, 11], corner: 'upper-right' as const },
  { id: 2, teeth: [21, 22, 23, 24, 25, 26, 27, 28], corner: 'upper-left' as const },
  { id: 4, teeth: [48, 47, 46, 45, 44, 43, 42, 41], corner: 'lower-right' as const },
  { id: 3, teeth: [31, 32, 33, 34, 35, 36, 37, 38], corner: 'lower-left' as const },
];
const CHILD_QUADRANTS = [
  { id: 5, teeth: [55, 54, 53, 52, 51], corner: 'upper-right' as const },
  { id: 6, teeth: [61, 62, 63, 64, 65], corner: 'upper-left' as const },
  { id: 8, teeth: [85, 84, 83, 82, 81], corner: 'lower-right' as const },
  { id: 7, teeth: [71, 72, 73, 74, 75], corner: 'lower-left' as const },
];

const isUpperTooth = (id: number) => (id >= 11 && id <= 28) || (id >= 51 && id <= 65);
const isRightSideTooth = (id: number) =>
  (id >= 11 && id <= 18) || (id >= 41 && id <= 48) || (id >= 51 && id <= 55) || (id >= 81 && id <= 85);
const isAnterior = (id: number) => (id % 10) <= 3; // incisors + canines

// Map a visual sector of the tooth box to the clinical surface name.
function partToSurface(id: number, part: VisualPart): string {
  if (part === 'center') return isAnterior(id) ? 'Incisal' : 'Occlusal';
  const upper = isUpperTooth(id);
  if (part === 'top') return upper ? 'Vestibular' : 'Lingual';
  if (part === 'bottom') return upper ? 'Palatal' : 'Vestibular';
  const rightSide = isRightSideTooth(id);
  if (part === 'left') return rightSide ? 'Distal' : 'Mesial';
  if (part === 'right') return rightSide ? 'Mesial' : 'Distal';
  return 'Occlusal';
}
function surfacesOf(id: number): string[] {
  return (['center', 'top', 'left', 'right', 'bottom'] as VisualPart[]).map((p) => partToSurface(id, p));
}

// ─── Treatment helpers ──────────────────────────────────────────────────────
const treatmentsForTooth = (treatments: Treatment[], id: number) =>
  treatments.filter((t) => t.tooth === String(id));

function statusForSurface(treatments: Treatment[], id: number, surface: string): Status | null {
  const rel = treatmentsForTooth(treatments, id);
  const exact = rel.find((t) => t.surface === surface);
  if (exact) return exact.status;
  const byDesc = rel.find((t) => t.description && t.description.toLowerCase().includes(surface.toLowerCase()));
  if (byDesc) return byDesc.status;
  const general = rel.find((t) => !t.surface);
  if (general && (surface === 'Occlusal' || surface === 'Incisal')) return general.status;
  return null;
}
function toothStatus(treatments: Treatment[], id: number): Status | null {
  const rel = treatmentsForTooth(treatments, id);
  if (!rel.length) return null;
  const hasC = rel.some((t) => t.status === 'completed');
  const hasP = rel.some((t) => t.status === 'planned');
  if (hasC && hasP) return 'mixed';
  return hasC ? 'completed' : 'planned';
}

const STATUS_FILL: Record<Status, string> = {
  completed: 'fill-emerald-500 dark:fill-emerald-500',
  planned: 'fill-sky-500 dark:fill-sky-500',
  mixed: 'fill-amber-500 dark:fill-amber-500',
};
const STATUS_DOT: Record<Status, string> = {
  completed: 'bg-emerald-500',
  planned: 'bg-sky-500',
  mixed: 'bg-amber-500',
};
const surfaceFill = (status: Status | null) =>
  status ? STATUS_FILL[status] : 'fill-white dark:fill-surface-800 hover:fill-surface-100 dark:hover:fill-surface-700';

// ─── Tooth number label ─────────────────────────────────────────────────────
const ToothNum: React.FC<{ id: number; active: boolean }> = ({ id, active }) => (
  <span className={cn('text-[10px] font-semibold tabular-nums leading-none', active ? 'text-primary-600 dark:text-primary-300' : 'text-surface-400')}>
    {id}
  </span>
);

// ─── Clinical view: the 5-surface tooth box ─────────────────────────────────
const BOX_PARTS: Record<VisualPart, string> = {
  center: 'M32,32 L68,32 L68,68 L32,68 Z',
  top: 'M4,4 L96,4 L68,32 L32,32 Z',
  bottom: 'M4,96 L96,96 L68,68 L32,68 Z',
  left: 'M4,4 L32,32 L32,68 L4,96 Z',
  right: 'M96,4 L68,32 L68,68 L96,96 Z',
};

const ToothBox: React.FC<{
  id: number;
  treatments: Treatment[];
  selected: boolean;
  onSelect: (id: number) => void;
  onSurface: (id: number, surface: string) => void;
}> = ({ id, treatments, selected, onSelect, onSurface }) => {
  const upper = isUpperTooth(id);
  const st = toothStatus(treatments, id);
  const count = treatmentsForTooth(treatments, id).length;
  return (
    <div className="flex flex-col items-center gap-1 group select-none">
      {upper && <ToothNum id={id} active={!!st} />}
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={cn(
          'relative rounded-sm transition-transform group-hover:scale-110',
          selected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-surface-900',
        )}
        title={`#${id}${count ? ` · ${count}` : ''}`}
      >
        <svg width={34} height={34} viewBox="0 0 100 100" className="overflow-visible drop-shadow-sm">
          {(Object.keys(BOX_PARTS) as VisualPart[]).map((part) => {
            const surf = partToSurface(id, part);
            const status = statusForSurface(treatments, id, surf);
            return (
              <path
                key={part}
                d={BOX_PARTS[part]}
                className={cn(surfaceFill(status), 'stroke-surface-300 dark:stroke-surface-600 stroke-[2] cursor-pointer transition-colors')}
                onClick={(e) => { e.stopPropagation(); onSelect(id); onSurface(id, surf); }}
              >
                <title>{surf}</title>
              </path>
            );
          })}
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-primary-600 text-white text-[9px] leading-[15px] font-bold text-center shadow">
            {count}
          </span>
        )}
      </button>
      {!upper && <ToothNum id={id} active={!!st} />}
    </div>
  );
};

// ─── Anatomical view: simplified tooth silhouettes ──────────────────────────
const TOOTH_PATHS = {
  molar: 'M10,50 C5,60 5,85 12,92 C25,98 40,98 52,92 C59,85 59,60 54,50 C40,55 24,55 10,50 Z',
  premolar: 'M14,50 C9,60 9,82 15,88 C26,93 38,93 49,88 C55,82 55,60 50,50 C38,55 26,55 14,50 Z',
  canine: 'M18,50 C13,60 18,90 30,96 C42,90 47,60 42,50 C36,53 24,53 18,50 Z',
  incisor: 'M20,50 C17,60 17,86 20,92 C24,94 36,94 40,92 C43,86 43,60 40,50 C36,53 24,53 20,50 Z',
} as const;
const toothKind = (id: number): keyof typeof TOOTH_PATHS => {
  const n = id % 10;
  if (n <= 2) return 'incisor';
  if (n === 3) return 'canine';
  if (n <= 5) return 'premolar';
  return 'molar';
};

const ToothShape: React.FC<{
  id: number;
  treatments: Treatment[];
  selected: boolean;
  onSelect: (id: number) => void;
}> = ({ id, treatments, selected, onSelect }) => {
  const upper = isUpperTooth(id);
  const st = toothStatus(treatments, id);
  const count = treatmentsForTooth(treatments, id).length;
  const kind = toothKind(id);
  const fill =
    st === 'completed' ? 'fill-emerald-400 dark:fill-emerald-600'
      : st === 'planned' ? 'fill-sky-400 dark:fill-sky-600'
        : st === 'mixed' ? 'fill-amber-400 dark:fill-amber-600'
          : 'fill-white dark:fill-surface-800 hover:fill-surface-50 dark:hover:fill-surface-700';
  return (
    <div className="flex flex-col items-center gap-1 group select-none cursor-pointer" onClick={() => onSelect(id)}>
      {upper && <ToothNum id={id} active={!!st} />}
      <button
        type="button"
        className={cn('relative rounded-md transition-transform group-hover:scale-110', selected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-surface-900')}
        title={`#${id}${count ? ` · ${count}` : ''}`}
      >
        <svg width={28} height={42} viewBox="0 0 64 100" className="drop-shadow-sm">
          <g transform={upper ? '' : 'scale(1,-1) translate(0,-100)'}>
            <path d={TOOTH_PATHS[kind]} className={cn(fill, 'stroke-surface-400 dark:stroke-surface-500 stroke-[1.5] transition-colors')} />
          </g>
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary-600 text-white text-[9px] leading-[14px] font-bold text-center shadow">
            {count}
          </span>
        )}
      </button>
      {!upper && <ToothNum id={id} active={!!st} />}
    </div>
  );
};

// ─── A row of teeth for one quadrant ────────────────────────────────────────
const Quadrant: React.FC<{
  teeth: number[];
  view: ViewMode;
  treatments: Treatment[];
  selected: number | null;
  align: 'start' | 'end';
  onSelect: (id: number) => void;
  onSurface: (id: number, surface: string) => void;
}> = ({ teeth, view, treatments, selected, align, onSelect, onSurface }) => (
  <div className={cn('flex gap-1 sm:gap-1.5', align === 'end' ? 'justify-end' : 'justify-start')}>
    {teeth.map((id) =>
      view === 'clinical' ? (
        <ToothBox key={id} id={id} treatments={treatments} selected={selected === id} onSelect={onSelect} onSurface={onSurface} />
      ) : (
        <ToothShape key={id} id={id} treatments={treatments} selected={selected === id} onSelect={onSelect} />
      ),
    )}
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────────
const SegBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all',
      active ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-300 shadow-sm' : 'text-surface-500 hover:text-surface-900 dark:text-surface-400',
    )}
  >
    {icon}{label}
  </button>
);

export const Odontogram: React.FC<OdontogramProps> = ({ treatments, onToothClick }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewMode>('clinical');
  const [dentition, setDentition] = useState<DentitionType>('adult');
  const [selected, setSelected] = useState<number | null>(null);

  const quadrants = dentition === 'adult' ? ADULT_QUADRANTS : CHILD_QUADRANTS;
  const byCorner = (corner: string) => quadrants.find((q) => q.corner === corner)!;
  const ur = byCorner('upper-right');
  const ul = byCorner('upper-left');
  const lr = byCorner('lower-right');
  const ll = byCorner('lower-left');

  const onSurface = (id: number, surface: string) => onToothClick(String(id), surface);

  const selTreatments = useMemo(
    () => (selected != null ? treatmentsForTooth(treatments, selected) : []),
    [treatments, selected],
  );
  const surfaceLabel = (s: string) => t(`surface_${s.toLowerCase()}`, s);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          <SegBtn active={view === 'clinical'} onClick={() => setView('clinical')} icon={<Grid3x3 size={14} />} label={t('odontogramClinical', 'Clinical')} />
          <SegBtn active={view === 'anatomical'} onClick={() => setView('anatomical')} icon={<Layers size={14} />} label={t('odontogramAnatomical', 'Anatomical')} />
        </div>
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          <SegBtn active={dentition === 'adult'} onClick={() => { setDentition('adult'); setSelected(null); }} icon={<User size={14} />} label={t('dentitionAdult', 'Adult')} />
          <SegBtn active={dentition === 'child'} onClick={() => { setDentition('child'); setSelected(null); }} icon={<Baby size={14} />} label={t('dentitionChild', 'Child')} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Chart */}
        <div className="flex-1 min-w-0 overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[560px] mx-auto w-fit">
            {/* Upper quadrant labels */}
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-surface-400 px-1 mb-1">
              <span>Q{ur.id} · {t('quadrantUpperRight', 'Upper right')}</span>
              <span>Q{ul.id} · {t('quadrantUpperLeft', 'Upper left')}</span>
            </div>
            {/* Upper arch */}
            <div className="flex items-end gap-3 pb-4 mb-1 border-b-2 border-dashed border-surface-200 dark:border-surface-700">
              <Quadrant teeth={ur.teeth} view={view} treatments={treatments} selected={selected} align="end" onSelect={setSelected} onSurface={onSurface} />
              <div className="self-stretch w-px bg-surface-300 dark:bg-surface-600" />
              <Quadrant teeth={ul.teeth} view={view} treatments={treatments} selected={selected} align="start" onSelect={setSelected} onSurface={onSurface} />
            </div>
            {/* Lower arch */}
            <div className="flex items-start gap-3 pt-4">
              <Quadrant teeth={lr.teeth} view={view} treatments={treatments} selected={selected} align="end" onSelect={setSelected} onSurface={onSurface} />
              <div className="self-stretch w-px bg-surface-300 dark:bg-surface-600" />
              <Quadrant teeth={ll.teeth} view={view} treatments={treatments} selected={selected} align="start" onSelect={setSelected} onSurface={onSurface} />
            </div>
            {/* Lower quadrant labels */}
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-surface-400 px-1 mt-1">
              <span>Q{lr.id} · {t('quadrantLowerRight', 'Lower right')}</span>
              <span>Q{ll.id} · {t('quadrantLowerLeft', 'Lower left')}</span>
            </div>
          </div>
        </div>

        {/* Selected-tooth detail panel */}
        <div className="lg:w-72 shrink-0">
          {selected == null ? (
            <div className="h-full min-h-[140px] rounded-xl border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center text-center text-sm text-surface-400 p-6">
              <CircleDot size={22} className="mb-2 opacity-50" />
              {t('odontogramSelectHint', 'Click a tooth to see its history and add treatments.')}
            </div>
          ) : (
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 font-bold flex items-center justify-center text-sm tabular-nums">{selected}</span>
                  <div>
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">{t('odontogramTooth', 'Tooth')} {selected}</div>
                    <div className="text-xs text-surface-500">
                      {selTreatments.length === 0
                        ? t('odontogramNoTreatments', 'No treatments')
                        : t('odontogramTreatmentCount', '{{count}} treatment(s)', { count: selTreatments.length })}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"><X size={16} /></button>
              </div>

              {selTreatments.length > 0 && (
                <ul className="space-y-1.5 mb-3 max-h-52 overflow-y-auto custom-scrollbar">
                  {selTreatments.map((tr) => (
                    <li key={tr.id} className="text-xs flex items-start gap-2 rounded-lg bg-surface-50 dark:bg-surface-900/40 px-2 py-1.5">
                      <span className={cn('mt-1 w-2 h-2 rounded-full shrink-0', STATUS_DOT[(tr.status === 'completed' ? 'completed' : 'planned') as Status])} />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium text-surface-800 dark:text-surface-200">{tr.description || t('odontogramTreatment', 'Treatment')}</span>
                        {tr.surface && <span className="ml-1 text-[10px] uppercase text-surface-500">· {surfaceLabel(tr.surface)}</span>}
                        <span className="block text-[10px] text-surface-400">{tr.date?.split('T')[0]}{tr.price ? ` · ${tr.price}` : ''}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => onToothClick(String(selected))}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <Plus size={15} /> {t('odontogramAddTreatment', 'Add treatment')}
              </button>

              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-surface-400 mb-1.5">{t('odontogramBySurface', 'By surface')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(surfacesOf(selected))].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onToothClick(String(selected), s)}
                      className="text-[11px] px-2 py-1 rounded-md border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                    >
                      {surfaceLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-surface-600 dark:text-surface-400 border-t border-surface-100 dark:border-surface-800 pt-3">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-500" />{t('odontogramLegendPlanned', 'Planned')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />{t('odontogramLegendCompleted', 'Completed')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" />{t('odontogramLegendMixed', 'Planned + completed')}</span>
        {view === 'clinical' && (
          <span className="text-surface-400">
            {t('odontogramSurfaceKey', 'Surfaces: centre = occlusal/incisal · top = vestibular · bottom = palatal/lingual · sides = mesial/distal')}
          </span>
        )}
      </div>
    </div>
  );
};
