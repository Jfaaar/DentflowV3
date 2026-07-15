import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('Auth gates on prescriptions + inventory cluster', () => {
  it.each([
    '/api/v1/prescriptions',
    '/api/v1/inventory',
    '/api/v1/suppliers',
    '/api/v1/inventory-transactions',
  ])('GET %s returns 401 unauthenticated', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Zod prescription validation', () => {
  it('requires patientId', () => {
    const { prescriptionCreateSchema } = require('../validation/prescriptions.js');
    expect(prescriptionCreateSchema.safeParse({}).success).toBe(false);
  });
  it('accepts a minimal prescription with default empty items', () => {
    const { prescriptionCreateSchema } = require('../validation/prescriptions.js');
    const r = prescriptionCreateSchema.safeParse({ patientId: 'p1' });
    expect(r.success).toBe(true);
    expect(r.data.items).toEqual([]);
  });
});

describe('Zod inventory validation', () => {
  it('requires name + type', () => {
    const { inventoryItemCreateSchema } = require('../validation/inventory.js');
    expect(inventoryItemCreateSchema.safeParse({}).success).toBe(false);
  });
  it('rejects unknown type', () => {
    const { inventoryItemCreateSchema } = require('../validation/inventory.js');
    expect(
      inventoryItemCreateSchema.safeParse({ name: 'X', type: 'bogus' }).success
    ).toBe(false);
  });
  it('adjustStockBodySchema requires reason', () => {
    const { adjustStockBodySchema } = require('../validation/inventory.js');
    expect(adjustStockBodySchema.safeParse({ delta: 5 }).success).toBe(false);
    expect(adjustStockBodySchema.safeParse({ delta: 5, reason: 'restock' }).success).toBe(true);
  });
});

describe('Zod suppliers validation', () => {
  it('requires name', () => {
    const { supplierCreateSchema } = require('../validation/suppliers.js');
    expect(supplierCreateSchema.safeParse({}).success).toBe(false);
    expect(supplierCreateSchema.safeParse({ name: 'Acme' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    const { supplierCreateSchema } = require('../validation/suppliers.js');
    expect(supplierCreateSchema.safeParse({ name: 'Acme', email: 'nope' }).success).toBe(false);
  });
});

describe('Zod inventory transactions validation', () => {
  it('rejects unknown type', () => {
    const { inventoryTxnCreateSchema } = require('../validation/inventoryTransactions.js');
    expect(
      inventoryTxnCreateSchema.safeParse({ medicamentId: 'i1', type: 'bogus', quantity: 1 }).success
    ).toBe(false);
  });
  it('rejects non-positive quantity', () => {
    const { inventoryTxnCreateSchema } = require('../validation/inventoryTransactions.js');
    expect(
      inventoryTxnCreateSchema.safeParse({ medicamentId: 'i1', type: 'IN', quantity: 0 }).success
    ).toBe(false);
  });
  it('accepts valid IN transaction', () => {
    const { inventoryTxnCreateSchema } = require('../validation/inventoryTransactions.js');
    expect(
      inventoryTxnCreateSchema.safeParse({ medicamentId: 'i1', type: 'IN', quantity: 5 }).success
    ).toBe(true);
  });
});
