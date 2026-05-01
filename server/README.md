# DentFlow Server

Phase 4 backend hardening split the original ~1k-line `server/index.js`
monolith into focused modules. This document records the layout, conventions,
and how to add a new route safely.

## Layout

```
server/
  index.js                 Bootstrap: helmet, CORS, rate limit, body parser,
                           mount routers, error handler, listen.
  db.js                    Local JSON DB (existing).
  data.json                Local JSON DB file.
  lib/
    permissions.js         JS port of the permission matrix from lib/permissions.ts.
    supabase.js            Supabase admin + auth clients (singleton).
  middleware/
    auth.js                authenticateToken: validates Supabase access tokens.
    permissions.js         requireRole(...roles), requirePermission(...perms).
    validate.js            validate({ body, query, params }) Zod-based validator.
    audit.js               audit(action, options) logs to audit_logs on success.
    rateLimit.js           authLimiter (20/15min) + defaultLimiter (200/15min).
  routes/
    auth.js                Public invitation lookup + accept (rate-limited).
    backoffice.js          /api/backoffice/* and /api/admin/* (super_admin).
    staff.js               /api/staff and /api/clinic/*.
    documents.js           Patients, appointments, invoices.
    uploads.js             /api/patients/:id/radios (multer + audit).
    health.js              GET /api/health -> { ok: true, version }.
  schemas/
    auth.js                Zod schemas for invitation accept.
    backoffice.js          Zod schemas for clinic/user/customer routes.
    patients.js            Zod schemas for patients, appointments, invoices.
    documents.js           Zod schemas for document path params.
  services/
    clinicService.js       Pure functions over the local DB (testable).
    patientService.js      Pure functions for patients/radios/etc.
  __tests__/               Vitest + supertest smoke tests.
```

## Adding a new route

1. **Pick the right router file.** If none fits, create one under `server/routes/`
   and mount it from `server/index.js`.
2. **Write a Zod schema** in `server/schemas/<area>.js` for any body / query /
   param the route accepts. Every route that accepts a body MUST validate it.
3. **Wire middleware in this order:**
   ```js
   router.post('/foo',
     authenticateToken,                  // populates req.user
     requireRole('clinic_admin'),        // or requirePermission('clinic:create')
     validate({ body: fooSchema }),      // 400 + { error, issues } on failure
     audit('foo.create', { resource: 'foo' }),  // logs on 2xx/3xx
     async (req, res) => { ... }
   );
   ```
4. **Push business logic into a service** under `server/services/` so it stays
   testable and independent of Express.

## Validation convention

`validate({ body, query, params })` parses with Zod and replaces `req.body`,
`req.query`, `req.params` with the parsed (and coerced) values. On failure the
response is:

```json
{
  "error": "Invalid request body",
  "issues": [{ "path": ["adminEmail"], "message": "Valid admin email required", "code": "invalid_string" }]
}
```

Status code is always `400`.

## Audit convention

`audit(action, options)` is a post-response hook: it inserts a row into
`audit_logs` only when `res.statusCode < 400`. The row contains `action`,
`actor_id`, `actor_role`, `resource`, `resource_id`, `ip`, `user_agent`,
`status_code`, `duration_ms`, optional `metadata`, and `created_at`.

The following privileged writes are audit-logged today:

| Action                  | Where                                             |
| ----------------------- | ------------------------------------------------- |
| `clinic.create`         | `POST /api/backoffice/clinics`, `POST /api/admin/clinics` |
| `clinic.update`         | `PUT /api/backoffice/clinics/:id`                |
| `clinic.delete`         | `DELETE /api/backoffice/clinics/:id`             |
| `user.create`           | `POST /api/backoffice/clinics/:id/users`, `POST /api/admin/customers`, `POST /api/staff` |
| `user.update`           | `PUT /api/backoffice/users/:id`                  |
| `user.delete`           | `DELETE /api/backoffice/users/:id`, `DELETE /api/admin/customers/:id`, `DELETE /api/clinic/staff/:id` |
| `user.reset-password`   | `POST /api/backoffice/users/:id/reset-password`  |
| `user.role-change`      | `PUT /api/backoffice/users/:id/role`             |
| `invitation.create`     | `POST /api/clinic/invitations`                   |
| `document.create`       | `POST /api/patients/:id/radios`                  |

Audit insertion is best-effort: if Supabase is not configured or insertion
fails, the request still succeeds and a warning is logged.

## Permissions

Roles: `super_admin`, `clinic_admin`, `doctor`, `assistant`. The matrix lives
in `server/lib/permissions.js`. Use `requireRole(...roles)` for simple
role-gated routes and `requirePermission(...perms)` for behavior-keyed
authorization.

## Rate limiting

- `/api/auth/*` → 20 requests / 15 minutes / IP
- everything else under `/api` → 200 requests / 15 minutes / IP

Exceeded requests get a `429` with a JSON `error` body.

## CORS

Allowlist comes from `CORS_ORIGINS` (comma-separated) in `.env.local`.
If unset, CORS is permissive (development convenience). Set it in production.

## Testing

```bash
npm test
```

Smoke tests live under `server/__tests__/` and use Vitest + supertest. They do
NOT start the server on a port; they import `createApp()` and exercise it via
in-process HTTP.
