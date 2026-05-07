// Medical bundle service: vitals + problems + vaccinations + body regions.
const vitalsRepo = require('../repositories/vitalSignsRepository');
const problemsRepo = require('../repositories/problemListRepository');
const vaccinationsRepo = require('../repositories/vaccinationsRepository');
const bodyRegionRepo = require('../repositories/bodyRegionFindingsRepository');
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

module.exports = {
  vitals: makeResource(vitalsRepo, 'Vital signs entry'),
  problems: makeResource(problemsRepo, 'Problem'),
  vaccinations: makeResource(vaccinationsRepo, 'Vaccination'),
  bodyRegions: makeResource(bodyRegionRepo, 'Body region finding'),
};
