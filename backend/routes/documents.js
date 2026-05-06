// Patients, appointments, invoices, radiology read endpoints.
// Upload + delete radiology lives in routes/uploads.js (multer there).
const express = require('express');
const { validate } = require('../middleware/validate');
const patients = require('../services/patientService');
const {
  createPatientSchema,
  updatePatientSchema,
  upsertAppointmentsSchema,
  invoiceSchema,
  idParamSchema,
} = require('../schemas/patients');

const router = express.Router();
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// Patients
router.get('/patients', async (req, res) => {
  await delay(200);
  res.json(patients.listPatients());
});

router.post(
  '/patients',
  validate({ body: createPatientSchema }),
  async (req, res) => {
    await delay(200);
    res.json(patients.createPatient(req.body));
  }
);

router.put(
  '/patients/:id',
  validate({ params: idParamSchema, body: updatePatientSchema }),
  async (req, res) => {
    await delay(200);
    const result = patients.updatePatient(req.params.id, req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

router.delete(
  '/patients/:id',
  validate({ params: idParamSchema }),
  async (req, res) => {
    await delay(200);
    res.json(patients.deletePatient(req.params.id));
  }
);

// Appointments
router.get('/appointments', async (req, res) => {
  await delay(200);
  res.json(patients.listAppointments());
});

router.post(
  '/appointments',
  validate({ body: upsertAppointmentsSchema }),
  async (req, res) => {
    await delay(200);
    res.json(patients.upsertAppointments(req.body));
  }
);

router.put(
  '/appointments/:id/restore',
  validate({ params: idParamSchema }),
  async (req, res) => {
    await delay(200);
    const result = patients.restoreAppointment(req.params.id);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

// Invoices
router.get('/invoices', async (req, res) => {
  await delay(200);
  res.json(patients.listInvoices());
});

router.post(
  '/invoices',
  validate({ body: invoiceSchema }),
  async (req, res) => {
    await delay(200);
    res.json(patients.createInvoice(req.body));
  }
);

router.put(
  '/invoices/:id',
  validate({ params: idParamSchema, body: invoiceSchema }),
  async (req, res) => {
    await delay(200);
    const result = patients.updateInvoice(req.params.id, req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

module.exports = router;
