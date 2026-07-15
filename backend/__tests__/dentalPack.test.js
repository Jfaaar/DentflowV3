// Smoke + validation tests for the dental pack endpoints (Phase 1.D):
// endo / ortho episodes & visits / lab cases.
import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('Route 401 surface (unauthenticated)', () => {
  const cases = [
    ['get',    '/api/v1/dental/endo'],
    ['post',   '/api/v1/dental/endo'],
    ['get',    '/api/v1/dental/ortho/episodes'],
    ['post',   '/api/v1/dental/ortho/episodes'],
    ['get',    '/api/v1/dental/ortho/episodes/abc/visits'],
    ['post',   '/api/v1/dental/ortho/episodes/abc/visits'],
    ['get',    '/api/v1/dental/lab-cases'],
    ['post',   '/api/v1/dental/lab-cases'],
  ];
  for (const [method, url] of cases) {
    it(`${method.toUpperCase()} ${url} returns 401`, async () => {
      const res = await request(app)[method](url).send({});
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  }
});

describe('Zod — endo schemas', () => {
  it('endoCreateSchema requires patientId + tooth', () => {
    const { endoCreateSchema } = require('../validation/dentalPack.js');
    expect(endoCreateSchema.safeParse({}).success).toBe(false);
    expect(endoCreateSchema.safeParse({ patientId: 'p1' }).success).toBe(false);
    expect(endoCreateSchema.safeParse({ patientId: 'p1', tooth: '36' }).success).toBe(true);
  });

  it('endoCreateSchema accepts canals JSON array', () => {
    const { endoCreateSchema } = require('../validation/dentalPack.js');
    const r = endoCreateSchema.safeParse({
      patientId: 'p1',
      tooth: '36',
      canals: [
        { name: 'MB', lengthMm: 19.5, fileSize: '25', obturation: 'GP' },
        { name: 'DB', lengthMm: 18, obturation: 'GP' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('endoCreateSchema rejects canal length out of 0..40', () => {
    const { endoCreateSchema } = require('../validation/dentalPack.js');
    expect(
      endoCreateSchema.safeParse({ patientId: 'p1', tooth: '36', canals: [{ lengthMm: 50 }] }).success,
    ).toBe(false);
  });
});

describe('Zod — ortho schemas', () => {
  it('orthoEpisodeCreateSchema requires patientId', () => {
    const { orthoEpisodeCreateSchema } = require('../validation/dentalPack.js');
    expect(orthoEpisodeCreateSchema.safeParse({}).success).toBe(false);
    expect(orthoEpisodeCreateSchema.safeParse({ patientId: 'p1' }).success).toBe(true);
  });

  it('orthoEpisodeCreateSchema enforces the status enum', () => {
    const { orthoEpisodeCreateSchema } = require('../validation/dentalPack.js');
    expect(orthoEpisodeCreateSchema.safeParse({ patientId: 'p1', status: 'lol' }).success).toBe(false);
    expect(orthoEpisodeCreateSchema.safeParse({ patientId: 'p1', status: 'retention' }).success).toBe(true);
  });

  it('orthoVisitCreateSchema accepts an empty body (visit_date defaults server-side)', () => {
    const { orthoVisitCreateSchema } = require('../validation/dentalPack.js');
    expect(orthoVisitCreateSchema.safeParse({}).success).toBe(true);
  });

  it('orthoVisitListQuerySchema defaults page=0 pageSize=100', () => {
    const { orthoVisitListQuerySchema } = require('../validation/dentalPack.js');
    const r = orthoVisitListQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.data.pageSize).toBe(100);
  });
});

describe('Zod — dental lab schemas', () => {
  it('dentalLabCreateSchema requires patientId / labName / caseType', () => {
    const { dentalLabCreateSchema } = require('../validation/dentalPack.js');
    expect(dentalLabCreateSchema.safeParse({}).success).toBe(false);
    expect(dentalLabCreateSchema.safeParse({ patientId: 'p1', labName: 'L', caseType: 'crown' }).success).toBe(true);
  });

  it('dentalLabCreateSchema enforces caseType + status enums', () => {
    const { dentalLabCreateSchema } = require('../validation/dentalPack.js');
    expect(
      dentalLabCreateSchema.safeParse({ patientId: 'p1', labName: 'L', caseType: 'unicorn' }).success,
    ).toBe(false);
    expect(
      dentalLabCreateSchema.safeParse({ patientId: 'p1', labName: 'L', caseType: 'crown', status: 'shipped' }).success,
    ).toBe(false);
    expect(
      dentalLabCreateSchema.safeParse({ patientId: 'p1', labName: 'L', caseType: 'crown', status: 'in_progress' }).success,
    ).toBe(true);
  });

  it('dentalLabListQuerySchema accepts the status filter', () => {
    const { dentalLabListQuerySchema } = require('../validation/dentalPack.js');
    const r = dentalLabListQuerySchema.safeParse({ status: 'sent' });
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('sent');
  });
});
