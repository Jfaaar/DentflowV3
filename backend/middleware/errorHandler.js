// Unified error response: { error: { code, message, details? } }.
// Services/repositories may throw a plain Error or a structured object with
// `status`, `code`, `message`, `details`.

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // CORS rejection
  if (err && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: { code: 'CORS_DENIED', message: 'Origin not allowed' } });
  }

  // ApiError thrown from services/controllers
  if (err && typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
    return res.status(err.status).json({
      error: {
        code: err.code || 'ERROR',
        message: err.message || 'Request failed',
        details: err.details,
      },
    });
  }

  // Supabase PostgrestError surfaces as { code, message, details, hint }
  if (err && typeof err.code === 'string' && err.message) {
    // Common: PGRST116 = 0 rows when single() expected -> 404
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    }
    return res.status(400).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } });
}

module.exports = { errorHandler, ApiError };
