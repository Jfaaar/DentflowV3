import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('Auth gates on treatments cluster', () => {
  it.each([
    '/api/v1/treatments',
    '/api/v1/treatment-plans',
    '/api/v1/quotes',
  ])('GET %s returns 401 when unauthenticated', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Zod treatments validation', () => {
  it('treatmentCreateSchema requires patientId/description/price/status', () => {
    const { treatmentCreateSchema } = require('../validation/treatments.js');
    expect(treatmentCreateSchema.safeParse({}).success).toBe(false);
  });

  it('treatmentCreateSchema accepts minimal completed treatment', () => {
    const { treatmentCreateSchema } = require('../validation/treatments.js');
    const r = treatmentCreateSchema.safeParse({
      patientId: 'p1',
      description: 'Composite filling',
      price: 200,
      status: 'completed',
    });
    expect(r.success).toBe(true);
  });
});

describe('Zod treatmentPlans validation', () => {
  it('treatmentPlanCreateSchema requires patientId + status', () => {
    const { treatmentPlanCreateSchema } = require('../validation/treatmentPlans.js');
    expect(treatmentPlanCreateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a draft plan', () => {
    const { treatmentPlanCreateSchema } = require('../validation/treatmentPlans.js');
    expect(
      treatmentPlanCreateSchema.safeParse({ patientId: 'p1', status: 'draft' }).success
    ).toBe(true);
  });
});

describe('Zod quotes validation', () => {
  it('quoteCreateSchema requires patientId + total', () => {
    const { quoteCreateSchema } = require('../validation/quotes.js');
    expect(quoteCreateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a minimal quote', () => {
    const { quoteCreateSchema } = require('../validation/quotes.js');
    expect(quoteCreateSchema.safeParse({ patientId: 'p1', total: 1000 }).success).toBe(true);
  });
});
