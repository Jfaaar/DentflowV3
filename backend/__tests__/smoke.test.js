// Smoke tests for the Phase 4 backend.
// Vitest must be imported as ESM. The server itself is CommonJS, so we
// `require` it via createRequire().
import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

let app;

beforeAll(() => {
  // Avoid loading the listener; just construct the Express app.
  const mod = require('../index.js');
  app = mod.createApp();
});

describe('GET /api/health', () => {
  it('returns 200 and { ok: true, version }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.version).toBe('string');
  });
});

describe('GET /api/backoffice/clinics (unauthenticated)', () => {
  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/backoffice/clinics');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/backoffice/clinics with malformed body', () => {
  it('returns 401 before validation when no token is provided', async () => {
    // authenticateToken runs before validate(), so an unauthenticated request
    // is rejected with 401 first regardless of body shape.
    const res = await request(app)
      .post('/api/backoffice/clinics')
      .send({ name: '' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('Zod schema rejects malformed clinic body with structured issues', async () => {
    const { createClinicSchema } = require('../schemas/backoffice.js');
    const result = createClinicSchema.safeParse({ name: '', adminEmail: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error.issues.length).toBeGreaterThan(0);
    // Each issue has the expected shape used by the validate() middleware.
    for (const issue of result.error.issues) {
      expect(Array.isArray(issue.path)).toBe(true);
      expect(typeof issue.message).toBe('string');
    }
  });
});
