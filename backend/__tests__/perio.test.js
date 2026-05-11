// Smoke + validation tests for the perio chart API (Phase 1.C).
// Mirrors the style of appointments.test.js — no auth-bypass; we assert the
// router is mounted and the validation surface is sane.
import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('GET /api/v1/dental/perio (unauthenticated)', () => {
  it('returns 401 with structured envelope', async () => {
    const res = await request(app).get('/api/v1/dental/perio');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/v1/dental/perio (unauthenticated)', () => {
  it('returns 401 before validation when no token is provided', async () => {
    const res = await request(app).post('/api/v1/dental/perio').send({});
    expect(res.status).toBe(401);
  });
});

describe('Zod perio validation', () => {
  it('perioChartCreateSchema requires patientId', () => {
    const { perioChartCreateSchema } = require('../validation/perio.js');
    expect(perioChartCreateSchema.safeParse({}).success).toBe(false);
  });

  it('perioChartCreateSchema accepts a header-only chart', () => {
    const { perioChartCreateSchema } = require('../validation/perio.js');
    const r = perioChartCreateSchema.safeParse({ patientId: 'p1' });
    expect(r.success).toBe(true);
  });

  it('perioChartCreateSchema accepts initial sites', () => {
    const { perioChartCreateSchema } = require('../validation/perio.js');
    const r = perioChartCreateSchema.safeParse({
      patientId: 'p1',
      sites: [
        { tooth: '11', position: 'buccal_mid', pocketDepthMm: 3, bleedingOnProbing: true },
        { tooth: '11', position: 'buccal_distal', pocketDepthMm: 4 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('perioSiteInputSchema rejects an unknown position', () => {
    const { perioSiteInputSchema } = require('../validation/perio.js');
    const r = perioSiteInputSchema.safeParse({ tooth: '11', position: 'top' });
    expect(r.success).toBe(false);
  });

  it('perioSiteInputSchema clamps pocket depth to 0..15', () => {
    const { perioSiteInputSchema } = require('../validation/perio.js');
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', pocketDepthMm: -1 }).success).toBe(false);
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', pocketDepthMm: 16 }).success).toBe(false);
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', pocketDepthMm: 5 }).success).toBe(true);
  });

  it('perioSiteInputSchema clamps mobility to 0..3 and furcation to 0..4', () => {
    const { perioSiteInputSchema } = require('../validation/perio.js');
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', mobility: 4 }).success).toBe(false);
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', mobility: 2 }).success).toBe(true);
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', furcation: 5 }).success).toBe(false);
    expect(perioSiteInputSchema.safeParse({ tooth: '11', position: 'buccal_mid', furcation: 3 }).success).toBe(true);
  });

  it('perioSitesReplaceSchema requires a sites array', () => {
    const { perioSitesReplaceSchema } = require('../validation/perio.js');
    expect(perioSitesReplaceSchema.safeParse({}).success).toBe(false);
    expect(perioSitesReplaceSchema.safeParse({ sites: [] }).success).toBe(true);
  });

  it('perioChartListQuerySchema coerces numeric strings and defaults', () => {
    const { perioChartListQuerySchema } = require('../validation/perio.js');
    const r = perioChartListQuerySchema.safeParse({ page: '2', pageSize: '25' });
    expect(r.success).toBe(true);
    expect(r.data.page).toBe(2);
    expect(r.data.pageSize).toBe(25);
    const r2 = perioChartListQuerySchema.safeParse({});
    expect(r2.success).toBe(true);
    expect(r2.data.page).toBe(0);
    expect(r2.data.pageSize).toBe(50);
  });
});
