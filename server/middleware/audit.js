// Audit logging middleware.
// Wraps a route to insert an audit_logs row when the response status is < 400.
// Use it as: router.post('/foo', auth, audit('clinic.create', { resource: 'clinic' }), handler)
//
// Insertion is best-effort: if Supabase isn't configured or the insert fails,
// the request is NOT failed. Errors are logged.
const { supabaseAdmin } = require('../lib/supabase');

function audit(action, options = {}) {
  return function auditMiddleware(req, res, next) {
    const start = Date.now();

    // Capture response body to derive resource ids when possible
    let captured;
    const origJson = res.json.bind(res);
    res.json = (body) => {
      captured = body;
      return origJson(body);
    };

    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      if (!supabaseAdmin) return;

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

        const row = {
          action,
          actor_id: req.user?.id || null,
          actor_role: req.user?.role || null,
          resource: options.resource || null,
          resource_id: resourceId,
          ip: req.ip || req.headers['x-forwarded-for'] || null,
          user_agent: req.headers['user-agent'] || null,
          status_code: res.statusCode,
          duration_ms: Date.now() - start,
          metadata: options.metadata ? options.metadata(req, captured) : null,
          created_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin.from('audit_logs').insert(row);
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('[audit] insert failed:', error.message);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[audit] unexpected error:', err?.message || err);
      }
    });

    next();
  };
}

module.exports = { audit };
