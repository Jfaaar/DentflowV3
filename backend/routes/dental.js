// Dental-pack routes (Phase 1).
// Mounted at /api/v1/dental. Each sub-router gates with requireFeature on
// its own key — perioChart, endoChart, orthoModule. The dental lab-case
// board reuses the dentalChart key as the "you're a dental clinic" gate.

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');

const perio = require('../controllers/perioController');
const pack = require('../controllers/dentalPackController');

const router = express.Router();
router.use(authenticateToken);

// ─── Perio (parent + child sites) ───────────────────────────────────────────
const perioGate = requireFeature('perioChart');
router.get('/perio',          perioGate, asyncHandler(perio.listCharts));
router.get('/perio/:id',      perioGate, asyncHandler(perio.getChart));
router.post('/perio',         perioGate, asyncHandler(perio.createChart));
router.put('/perio/:id',      perioGate, asyncHandler(perio.updateChart));
router.put('/perio/:id/sites', perioGate, asyncHandler(perio.replaceSites));
router.delete('/perio/:id',   perioGate, asyncHandler(perio.deleteChart));

// ─── Endodontic records ─────────────────────────────────────────────────────
const endoGate = requireFeature('endoChart');
router.get('/endo',         endoGate, asyncHandler(pack.endo.list));
router.get('/endo/:id',     endoGate, asyncHandler(pack.endo.get));
router.post('/endo',        endoGate, asyncHandler(pack.endo.create));
router.put('/endo/:id',     endoGate, asyncHandler(pack.endo.update));
router.delete('/endo/:id',  endoGate, asyncHandler(pack.endo.remove));

// ─── Ortho episodes + nested visits ─────────────────────────────────────────
const orthoGate = requireFeature('orthoModule');
router.get('/ortho/episodes',         orthoGate, asyncHandler(pack.orthoEpisodes.list));
router.get('/ortho/episodes/:id',     orthoGate, asyncHandler(pack.orthoEpisodes.get));
router.post('/ortho/episodes',        orthoGate, asyncHandler(pack.orthoEpisodes.create));
router.put('/ortho/episodes/:id',     orthoGate, asyncHandler(pack.orthoEpisodes.update));
router.delete('/ortho/episodes/:id',  orthoGate, asyncHandler(pack.orthoEpisodes.remove));

router.get('/ortho/episodes/:episodeId/visits',  orthoGate, asyncHandler(pack.orthoVisits.list));
router.post('/ortho/episodes/:episodeId/visits', orthoGate, asyncHandler(pack.orthoVisits.create));
router.get('/ortho/visits/:id',                  orthoGate, asyncHandler(pack.orthoVisits.get));
router.put('/ortho/visits/:id',                  orthoGate, asyncHandler(pack.orthoVisits.update));
router.delete('/ortho/visits/:id',               orthoGate, asyncHandler(pack.orthoVisits.remove));

// ─── Dental lab cases (reuses dentalChart gate) ─────────────────────────────
const labGate = requireFeature('dentalChart');
router.get('/lab-cases',         labGate, asyncHandler(pack.dentalLab.list));
router.get('/lab-cases/:id',     labGate, asyncHandler(pack.dentalLab.get));
router.post('/lab-cases',        labGate, asyncHandler(pack.dentalLab.create));
router.put('/lab-cases/:id',     labGate, asyncHandler(pack.dentalLab.update));
router.delete('/lab-cases/:id',  labGate, asyncHandler(pack.dentalLab.remove));

module.exports = router;
