import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('GET /api/v1/invoices (unauthenticated)', () => {
  it('returns 401', async () => {
    const res = await request(app).get('/api/v1/invoices');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/v1/payments (unauthenticated)', () => {
  it('returns 401', async () => {
    const res = await request(app).get('/api/v1/payments');
    expect(res.status).toBe(401);
  });
});

describe('Zod invoice validation', () => {
  it('rejects missing patientId/amount', () => {
    const { invoiceCreateSchema } = require('../validation/invoices.js');
    expect(invoiceCreateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a minimal valid invoice', () => {
    const { invoiceCreateSchema } = require('../validation/invoices.js');
    expect(invoiceCreateSchema.safeParse({ patientId: 'p1', amount: 100 }).success).toBe(true);
  });

  it('listQuery coerces page/pageSize', () => {
    const { invoicesListQuerySchema } = require('../validation/invoices.js');
    const r = invoicesListQuerySchema.safeParse({ page: '0', pageSize: '20' });
    expect(r.success).toBe(true);
    expect(r.data.pageSize).toBe(20);
  });
});

describe('Zod payment validation', () => {
  it('rejects missing invoiceId/amount', () => {
    const { paymentCreateSchema } = require('../validation/payments.js');
    expect(paymentCreateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts cash method default', () => {
    const { paymentCreateSchema } = require('../validation/payments.js');
    const r = paymentCreateSchema.safeParse({ invoiceId: 'i1', amount: 50 });
    expect(r.success).toBe(true);
  });

  it('rejects invalid method', () => {
    const { paymentCreateSchema } = require('../validation/payments.js');
    expect(
      paymentCreateSchema.safeParse({ invoiceId: 'i1', amount: 50, method: 'bitcoin' }).success
    ).toBe(false);
  });
});
