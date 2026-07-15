import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  normalize,
  computeSourceHash,
  normString,
} = require('../services/ammps/ammpsNormalizer');
const { diffRows } = require('../repositories/medicamentsCatalogRepository');

describe('normString', () => {
  it('strips diacritics, lowercases, collapses spaces', () => {
    expect(normString('  Spécialité  TEST  ')).toBe('specialite test');
  });
});

describe('computeSourceHash', () => {
  it('is stable across whitespace and case differences in key fields', () => {
    const a = { specialite: 'DOLIPRANE 500', dosage: '500 mg', forme: 'Comprimé', presentation: 'Boîte de 16', laboratoire: 'SANOFI' };
    const b = { specialite: '  doliprane 500 ', dosage: '500 MG', forme: 'comprime', presentation: 'boite de 16', laboratoire: 'sanofi' };
    expect(computeSourceHash(a)).toBe(computeSourceHash(b));
  });
  it('differs when a key field changes', () => {
    const a = { specialite: 'X', dosage: '10mg', forme: 'cp', presentation: 'b', laboratoire: 'L' };
    const b = { ...a, dosage: '20mg' };
    expect(computeSourceHash(a)).not.toBe(computeSourceHash(b));
  });
});

describe('normalize', () => {
  it('produces a row keyed by snake_case DB columns + source_hash', () => {
    const row = normalize(
      {
        specialite: 'DOLIPRANE 500',
        dosage: '500 mg',
        forme: 'Comprimé',
        presentation: 'Boîte de 16',
        substance_active: 'Paracétamol',
        laboratoire: 'SANOFI',
        ppv: 15.8,
      },
      { sourceUrl: 'https://x/y', syncedAt: new Date('2026-01-01T00:00:00Z') },
    );
    expect(row.specialite).toBe('DOLIPRANE 500');
    expect(row.substance_active).toBe('Paracétamol');
    expect(row.source_url).toBe('https://x/y');
    expect(row.last_synced_at.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(typeof row.source_hash).toBe('string');
    expect(row.source_hash).toHaveLength(64);
  });
  it('throws when specialite is missing', () => {
    expect(() => normalize({ dosage: '500mg' })).toThrow(/specialite/);
  });
});

describe('diffRows (catalog repo)', () => {
  const base = {
    specialite: 'X', dosage: '10mg', forme: 'cp', presentation: 'b',
    pp_gn: 'P', substance_active: 'sub', classe_therapeutique: 'c',
    laboratoire: 'L', statut_amm: 'Valide', statut_commercialisation: 'Commercialisé',
    ppv: 10, ph: 8, pfht: 7, tva: 7,
  };
  it('is empty when fields are equal (cross-type compare)', () => {
    const diffs = diffRows(base, { ...base, ppv: '10' });
    expect(diffs).toEqual([]);
  });
  it('classifies price field changes', () => {
    const diffs = diffRows(base, { ...base, ppv: 12.5 });
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe('ppv');
    expect(diffs[0].changeType).toBe('price_change');
  });
  it('classifies status field changes', () => {
    const diffs = diffRows(base, { ...base, statut_commercialisation: 'Retiré' });
    expect(diffs[0].changeType).toBe('status_change');
  });
  it('reports plain field_change for everything else', () => {
    const diffs = diffRows(base, { ...base, laboratoire: 'L2' });
    expect(diffs[0].changeType).toBe('field_change');
  });
});
