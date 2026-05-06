const { z } = require('zod');

// Multipart uploads can't be Zod-validated as a body before multer runs;
// param schemas keep us honest on patient ids.
const patientIdParamSchema = z.object({
  id: z.string().min(1),
});

const documentIdParamSchema = z.object({
  id: z.string().min(1),
});

module.exports = { patientIdParamSchema, documentIdParamSchema };
