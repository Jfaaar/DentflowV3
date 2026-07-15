// Dental pack service — bundles the CRUD-uniform resources for endo,
// orthoEpisodes, and dentalLab. orthoVisits sits beside them but takes
// its parent episodeId explicitly on create + list. Perio has its own
// service (parent + child with replace-semantics) — see perioService.js.

const endoRepo = require('../repositories/endoRepository');
const orthoEpisodeRepo = require('../repositories/orthoEpisodeRepository');
const orthoVisitRepo = require('../repositories/orthoVisitRepository');
const dentalLabRepo = require('../repositories/dentalLabRepository');
const { ApiError } = require('../middleware/errorHandler');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

function makeResource(repo, label) {
  return {
    list: (req, query) => repo.list(req.db, query),
    async get(req, id) {
      const r = await repo.get(req.db, id);
      if (!r) throw new ApiError(404, 'NOT_FOUND', `${label} not found`);
      return r;
    },
    create: (req, input) => repo.create(req.db, input, requireClinic(req)),
    async update(req, id, patch) {
      const existing = await repo.get(req.db, id);
      if (!existing) throw new ApiError(404, 'NOT_FOUND', `${label} not found`);
      return repo.update(req.db, id, patch);
    },
    remove: (req, id) => repo.remove(req.db, id),
  };
}

// Ortho visits — episode-scoped on list/create, by-id on update/delete.
const orthoVisits = {
  list: (req, episodeId, query) => orthoVisitRepo.list(req.db, { ...query, episodeId }),
  async get(req, id) {
    const r = await orthoVisitRepo.get(req.db, id);
    if (!r) throw new ApiError(404, 'NOT_FOUND', 'Ortho visit not found');
    return r;
  },
  async create(req, episodeId, input) {
    const episode = await orthoEpisodeRepo.get(req.db, episodeId);
    if (!episode) throw new ApiError(404, 'NOT_FOUND', 'Ortho episode not found');
    return orthoVisitRepo.create(req.db, episodeId, input, requireClinic(req));
  },
  async update(req, id, patch) {
    const existing = await orthoVisitRepo.get(req.db, id);
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Ortho visit not found');
    return orthoVisitRepo.update(req.db, id, patch);
  },
  remove: (req, id) => orthoVisitRepo.remove(req.db, id),
};

module.exports = {
  endo: makeResource(endoRepo, 'Endodontic record'),
  orthoEpisodes: makeResource(orthoEpisodeRepo, 'Ortho episode'),
  orthoVisits,
  dentalLab: makeResource(dentalLabRepo, 'Dental lab case'),
};
