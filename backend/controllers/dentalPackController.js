// HTTP layer for the dental pack — endo / orthoEpisodes / orthoVisits / labCases.
// Uses the makeHandlers helper mirrored from medicalController.js for the
// CRUD-uniform resources, plus bespoke handlers for ortho visits (the only
// resource where create + list take an episodeId from the URL).

const service = require('../services/dentalPackService');
const v = require('../validation/dentalPack');
const { idParamSchema } = require('../validation/common');
const { ApiError } = require('../middleware/errorHandler');
const { z } = require('zod');

function parseOrThrow(schema, value, where = 'body') {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION', `Invalid ${where}`, result.error.flatten());
  }
  return result.data;
}

function makeHandlers(resource, schemas) {
  return {
    async list(req, res) {
      const query = parseOrThrow(schemas.list, req.query, 'query');
      res.json({ data: await resource.list(req, query) });
    },
    async get(req, res) {
      const { id } = parseOrThrow(idParamSchema, req.params, 'params');
      res.json({ data: await resource.get(req, id) });
    },
    async create(req, res) {
      const input = parseOrThrow(schemas.create, req.body, 'body');
      res.status(201).json({ data: await resource.create(req, input) });
    },
    async update(req, res) {
      const { id } = parseOrThrow(idParamSchema, req.params, 'params');
      const patch = parseOrThrow(schemas.update, req.body, 'body');
      res.json({ data: await resource.update(req, id, patch) });
    },
    async remove(req, res) {
      const { id } = parseOrThrow(idParamSchema, req.params, 'params');
      await resource.remove(req, id);
      res.status(204).end();
    },
  };
}

const endo = makeHandlers(service.endo, {
  list: v.endoListQuerySchema,
  create: v.endoCreateSchema,
  update: v.endoUpdateSchema,
});

const orthoEpisodes = makeHandlers(service.orthoEpisodes, {
  list: v.orthoEpisodeListQuerySchema,
  create: v.orthoEpisodeCreateSchema,
  update: v.orthoEpisodeUpdateSchema,
});

const dentalLab = makeHandlers(service.dentalLab, {
  list: v.dentalLabListQuerySchema,
  create: v.dentalLabCreateSchema,
  update: v.dentalLabUpdateSchema,
});

// Ortho visits — episodeId comes from the URL on list/create.
const episodeParamSchema = z.object({ episodeId: z.string().min(1) });

const orthoVisits = {
  async list(req, res) {
    const { episodeId } = parseOrThrow(episodeParamSchema, req.params, 'params');
    const query = parseOrThrow(v.orthoVisitListQuerySchema, req.query, 'query');
    res.json({ data: await service.orthoVisits.list(req, episodeId, query) });
  },
  async get(req, res) {
    const { id } = parseOrThrow(idParamSchema, req.params, 'params');
    res.json({ data: await service.orthoVisits.get(req, id) });
  },
  async create(req, res) {
    const { episodeId } = parseOrThrow(episodeParamSchema, req.params, 'params');
    const input = parseOrThrow(v.orthoVisitCreateSchema, req.body, 'body');
    res.status(201).json({ data: await service.orthoVisits.create(req, episodeId, input) });
  },
  async update(req, res) {
    const { id } = parseOrThrow(idParamSchema, req.params, 'params');
    const patch = parseOrThrow(v.orthoVisitUpdateSchema, req.body, 'body');
    res.json({ data: await service.orthoVisits.update(req, id, patch) });
  },
  async remove(req, res) {
    const { id } = parseOrThrow(idParamSchema, req.params, 'params');
    await service.orthoVisits.remove(req, id);
    res.status(204).end();
  },
};

module.exports = { endo, orthoEpisodes, orthoVisits, dentalLab };
