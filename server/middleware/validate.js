// Zod request validation middleware.
// Usage: validate({ body: SomeSchema, query: ..., params: ... })
// On error responds with 400 and { error, issues } where issues is the Zod issue array.

function formatIssues(zodError) {
  return zodError.issues.map(i => ({
    path: i.path,
    message: i.message,
    code: i.code,
  }));
}

function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: 'Invalid request body',
            issues: formatIssues(result.error),
          });
        }
        req.body = result.data;
      }
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json({
            error: 'Invalid query params',
            issues: formatIssues(result.error),
          });
        }
        req.query = result.data;
      }
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json({
            error: 'Invalid path params',
            issues: formatIssues(result.error),
          });
        }
        req.params = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
