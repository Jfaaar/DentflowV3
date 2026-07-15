// Audit logging middleware — pg.
// Wraps a route to insert an audit_logs row when the response status is < 400.
// Use it as: router.post('/foo', auth, audit('clinic.create', { resource: 'clinic' }), handler)
//
// Insertion is best-effort: failures are logged but never propagated to
// the response.
const { getPool } = require('../db/pg');

function audit(action, options = {}) {
  return function auditMiddleware(req, res, next) {
    const start = Date.now();

    let captured;
    const origJson = res.json.bind(res);
    res.json = (body) => {
      captured = body;
      return origJson(body);
    };

    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      let pool;
      try {
        pool = getPool();
      } catch {
        return; // No DB configured; skip silently.
      }

      try {
        const resourceId = (() => {
          if (options.resourceIdFrom === 'params' && options.resourceIdParam) {
            return req.params[options.resourceIdParam];
          }
          if (captured && typeof captured === 'object') {
            if (captured.id) return String(captured.id);
            if (captured.clinic && captured.clinic.id) return String(captured.clinic.id);
            if (captured.user && captured.user.id) return String(captured.user.id);
          }
          return req.params?.id ? String(req.params.id) : null;
        })();

        await pool.query(
          `INSERT INTO audit_logs
             (action, actor_id, actor_role, resource, resource_id, ip,
              user_agent, status_code, duration_ms, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            action,
            req.user?.id || null,
            req.user?.role || null,
            options.resource || null,
            resourceId,
            req.ip || req.headers['x-forwarded-for'] || null,
            req.headers['user-agent'] || null,
            res.statusCode,
            Date.now() - start,
            options.metadata ? options.metadata(req, captured) : null,
          ],
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[audit] insert failed:', err?.message || err);
      }
    });

    next();
  };
}

module.exports = { audit };
