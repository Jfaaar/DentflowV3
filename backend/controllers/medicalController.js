const service = require('../services/medicalService');
const v = require('../validation/medical');
const { idParamSchema } = require('../validation/common');
const { ApiError } = require('../middleware/errorHandler');

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

module.exports = {
  vitals: makeHandlers(service.vitals, {
    list: v.vitalSignsListQuerySchema,
    create: v.vitalSignsCreateSchema,
    update: v.vitalSignsUpdateSchema,
  }),
  problems: makeHandlers(service.problems, {
    list: v.problemListQuerySchema,
    create: v.problemCreateSchema,
    update: v.problemUpdateSchema,
  }),
  vaccinations: makeHandlers(service.vaccinations, {
    list: v.vaccinationListQuerySchema,
    create: v.vaccinationCreateSchema,
    update: v.vaccinationUpdateSchema,
  }),
  bodyRegions: makeHandlers(service.bodyRegions, {
    list: v.bodyRegionListQuerySchema,
    create: v.bodyRegionCreateSchema,
    update: v.bodyRegionUpdateSchema,
  }),
};
