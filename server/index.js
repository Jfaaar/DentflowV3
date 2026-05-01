// DentFlow API - bootstrap entry point.
// Phase 4 hardening: helmet, rate limit, CORS allowlist, modular routers.
//
// Public surface is preserved (paths/methods/response shapes match the
// pre-split monolith). Error responses for invalid input are now structured
// as { error, issues } via the Zod validation middleware.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { authLimiter, defaultLimiter } = require('./middleware/rateLimit');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const backofficeRouter = require('./routes/backoffice');
const staffRouter = require('./routes/staff');
const documentsRouter = require('./routes/documents');
const { router: uploadsRouter } = require('./routes/uploads');

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGINS || '';
  const allowlist = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    // Default to permissive in dev to avoid surprises; production should set CORS_ORIGINS.
    return { origin: true, credentials: true };
  }

  return {
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header)
      if (!origin) return cb(null, true);
      if (allowlist.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  };
}

function createApp() {
  const app = express();

  // Express runs behind Vercel/proxies in production; trust the first hop so
  // rate-limit and audit logs see the real client IP.
  app.set('trust proxy', 1);

  // Security headers + CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://*.supabase.co'],
          connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          frameAncestors: ["'self'"],
        },
      },
      hsts: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '5mb' }));

  // Default rate limit for the API surface; auth endpoints get a tighter cap.
  app.use('/api/auth', authLimiter);
  app.use('/api', defaultLimiter);

  // Static uploads (radiology)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // ----------------- Routers -----------------
  app.use('/api/health', healthRouter);

  // Public auth routes are mounted twice for backwards compatibility:
  //   /api/invitations/:token (legacy)
  //   /api/auth/invitations/:token (new, rate-limited)
  app.use('/api/auth/invitations', authRouter);
  app.use('/api/invitations', authRouter);

  // Backoffice + Admin (super_admin)
  app.use('/api', backofficeRouter);

  // Staff + Clinic
  app.use('/api', staffRouter);

  // Patients / Appointments / Invoices
  app.use('/api', documentsRouter);

  // Radiology uploads (multer)
  app.use('/api', uploadsRouter);

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error('Server Error:', err);
    if (err && err.message === 'Origin not allowed by CORS') {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // Production static serving (kept for parity with the previous monolith)
  if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'build');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, 'index.html'));
      }
    });
  }

  return app;
}

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { createApp };
