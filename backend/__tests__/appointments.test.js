import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('GET /api/v1/appointments (unauthenticated)', () => {
  it('returns 401 with structured envelope', async () => {
    const res = await request(app).get('/api/v1/appointments');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Zod appointment validation', () => {
  it('appointmentCreateSchema requires patientId/start/end', () => {
    const { appointmentCreateSchema } = require('../validation/appointments.js');
    const result = appointmentCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('appointmentCreateSchema accepts a valid input', () => {
    const { appointmentCreateSchema } = require('../validation/appointments.js');
    const result = appointmentCreateSchema.safeParse({
      patientId: 'p1',
      start: '2026-01-01T10:00:00Z',
      end: '2026-01-01T10:30:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('appointmentsListQuerySchema coerces numeric strings', () => {
    const { appointmentsListQuerySchema } = require('../validation/appointments.js');
    const result = appointmentsListQuerySchema.safeParse({ page: '1', pageSize: '50' });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
  });

  it('cancelManyBodySchema rejects empty ids array', () => {
    const { cancelManyBodySchema } = require('../validation/appointments.js');
    const result = cancelManyBodySchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });
});

describe('POST /api/v1/appointments (unauthenticated)', () => {
  it('returns 401 before validation when no token is provided', async () => {
    const res = await request(app).post('/api/v1/appointments').send({});
    expect(res.status).toBe(401);
  });
});
