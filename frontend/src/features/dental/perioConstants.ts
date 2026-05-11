// Static metadata for the periodontal chart UI: FDI tooth ordering, the
// 6 probing positions, and pocket-depth severity bands.
import type { PerioPosition } from './api/perioApi';

// FDI permanent dentition, arranged the way a chart reads — patient's right
// to left across each arch.
export const UPPER_TEETH = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
export const LOWER_TEETH = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
export const ALL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH];

export const POSITIONS: PerioPosition[] = [
  'buccal_mesial', 'buccal_mid', 'buccal_distal',
  'lingual_mesial', 'lingual_mid', 'lingual_distal',
];
export const BUCCAL_POSITIONS: PerioPosition[] = ['buccal_mesial', 'buccal_mid', 'buccal_distal'];
export const LINGUAL_POSITIONS: PerioPosition[] = ['lingual_mesial', 'lingual_mid', 'lingual_distal'];

// Short labels for the per-tooth editor.
export const POSITION_LABEL: Record<PerioPosition, string> = {
  buccal_mesial: 'Buccal · mesial',
  buccal_mid: 'Buccal · mid',
  buccal_distal: 'Buccal · distal',
  lingual_mesial: 'Lingual · mesial',
  lingual_mid: 'Lingual · mid',
  lingual_distal: 'Lingual · distal',
};

// Pocket-depth severity → tailwind cell classes.
export function pdSeverityClass(mm: number | null | undefined): string {
  if (mm == null) return 'text-surface-400';
  if (mm <= 3) return 'text-emerald-700 dark:text-emerald-300';
  if (mm <= 5) return 'text-amber-700 dark:text-amber-300';
  return 'text-red-700 dark:text-red-300 font-semibold';
}
export function pdSeverityBg(mm: number | null | undefined): string {
  if (mm == null) return 'bg-surface-50 dark:bg-surface-800/40';
  if (mm <= 3) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (mm <= 5) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

export interface SiteData {
  pocketDepthMm?: number | null;
  recessionMm?: number | null;
  bleedingOnProbing?: boolean;
  suppuration?: boolean;
}
export interface ToothData {
  sites: Partial<Record<PerioPosition, SiteData>>;
  mobility?: number | null;
  furcation?: number | null;
}
export type ToothMap = Record<string /* tooth */, ToothData>;

export function emptyToothMap(): ToothMap {
  const m: ToothMap = {};
  for (const t of ALL_TEETH) m[t] = { sites: {} };
  return m;
}
