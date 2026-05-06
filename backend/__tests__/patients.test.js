// Tests for the layered /api/v1/patients endpoints.
// Auth middleware is enforced before controllers; without a token we expect
// 401 with the structured `{ error: { code, message } }` envelope.
import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('GET /api/v1/patients (unauthenticated)', () => {
  it('returns 401 with the structured error envelope', async () => {
    const res = await request(app).get('/api/v1/patients');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(typeof res.body.error.message).toBe('string');
  });
});

describe('POST /api/v1/patients (unauthenticated)', () => {
  it('returns 401 before validation when no token is provided', async () => {
    const res = await request(app).post('/api/v1/patients').send({ name: '' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Zod patient validation', () => {
  it('patientCreateSchema rejects empty name', () => {
    const { patientCreateSchema } = require('../validation/patients.js');
    const result = patientCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('patientCreateSchema accepts minimal valid input and applies status default', () => {
    const { patientCreateSchema } = require('../validation/patients.js');
    const result = patientCreateSchema.safeParse({ name: 'Jane Doe' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('active');
  });

  it('patientUpdateSchema accepts partial updates', () => {
    const { patientUpdateSchema } = require('../validation/patients.js');
    const result = patientUpdateSchema.safeParse({ phone: '+212600000000' });
    expect(result.success).toBe(true);
  });

  it('patientsListQuerySchema coerces numeric strings', () => {
    const { patientsListQuerySchema } = require('../validation/patients.js');
    const result = patientsListQuerySchema.safeParse({ page: '2', pageSize: '20' });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(2);
    expect(result.data.pageSize).toBe(20);
  });
});

describe('GET /api/v1/patients/:id (unauthenticated)', () => {
  it('returns 401 with INVALID_TOKEN/UNAUTHORIZED, never reaches handler', async () => {
    const res = await request(app).get('/api/v1/patients/abc123');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
