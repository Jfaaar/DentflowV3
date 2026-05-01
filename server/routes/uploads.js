// Radiology uploads (multer) + listing.
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { validate } = require('../middleware/validate');
const { audit } = require('../middleware/audit');
const patients = require('../services/patientService');
const { patientIdParamSchema } = require('../schemas/documents');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'radios');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'radio-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

router.get(
  '/patients/:id/radios',
  validate({ params: patientIdParamSchema }),
  async (req, res) => {
    await delay(200);
    res.json(patients.listRadios(req.params.id));
  }
);

router.post(
  '/patients/:id/radios',
  validate({ params: patientIdParamSchema }),
  upload.single('image'),
  audit('document.create', { resource: 'document' }),
  async (req, res) => {
    await delay(500);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json(patients.addRadio(req.params.id, req.file));
  }
);

module.exports = { router, UPLOADS_DIR };
