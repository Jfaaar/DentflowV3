# Backend image (Express API) — deployed on Back4App Containers.
#
# The frontend is NOT built here; it ships separately as a static site
# (Netlify/Vercel). Only frontend/package.json is copied, because npm needs
# every workspace manifest present to resolve the workspace lockfile.
#
# Back4App builds this from the repo root. See DEPLOY.md for the environment
# variables it expects — NODE_ENV=production is baked in below because without
# it the migration runner performs a DESTRUCTIVE RESET (drops every schema) on
# each boot. Do not override it.

FROM node:20-alpine

WORKDIR /app

# `production` also makes db/migrate.js refuse the destructive reset and skip
# the dev seeds. PORT is what Back4App routes traffic to.
ENV NODE_ENV=production \
    PORT=3001

# Manifests first, so a source-only change reuses the cached npm layer.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Backend deps only: the frontend workspace's toolchain (vite, react, …) has no
# business in an API image.
RUN npm ci --omit=dev --workspace=@medineeo/backend --include-workspace-root

COPY backend ./backend

# Radiology uploads. NOTE: this is container-local and therefore EPHEMERAL —
# every redeploy or restart wipes it. Fine for the demo; a real deployment needs
# object storage (see DEPLOY.md).
RUN mkdir -p backend/uploads/radios && chown -R node:node /app

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "backend/index.js"]
