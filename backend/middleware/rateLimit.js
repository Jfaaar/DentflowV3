// Rate-limit configurations.
// auth limiter: 20 requests / 15 minutes per IP for /api/auth/* (prod)
// default limiter: 200 requests / 15 minutes per IP for everything else (prod)
//
// In non-production, caps are loosened ~50x: a single page load can fire
// ~10 parallel calls, and React StrictMode doubles that during dev.
const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX ?? (isProd ? 20 : 1000));
const defaultMax = Number(process.env.RATE_LIMIT_DEFAULT_MAX ?? (isProd ? 200 : 10000));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later.' },
});

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: defaultMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

module.exports = { authLimiter, defaultLimiter };
