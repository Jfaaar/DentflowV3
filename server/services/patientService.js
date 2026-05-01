// Patient + appointment + invoice services backed by the local JSON DB.
const { readData, writeData } = require('../db');

const randomId = () => Math.random().toString(36).slice(2, 11);

function listPatients() {
  return readData().patients || [];
}

function createPatient(payload) {
  const db = readData();
  if (!db.patients) db.patients = [];
  const newPatient = { ...payload, id: randomId() };
  db.patients.push(newPatient);
  writeData(db);
  return newPatient;
}

function updatePatient(id, patch) {
  const db = readData();
  const index = (db.patients || []).findIndex(p => p.id === id);
  if (index === -1) return { error: { status: 404, message: 'Patient not found' } };
  db.patients[index] = { ...db.patients[index], ...patch };
  writeData(db);
  return { data: db.patients[index] };
}

function deletePatient(id) {
  const db = readData();
  db.patients = (db.patients || []).filter(p => p.id !== id);
  writeData(db);
  return { success: true };
}

function listRadios(patientId) {
  const db = readData();
  const radios = (db.radios || []).filter(r => r.patientId === patientId);
  radios.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return radios;
}

function addRadio(patientId, file) {
  const db = readData();
  if (!db.radios) db.radios = [];
  const newRadio = {
    id: randomId(),
    patientId,
    url: `/uploads/radios/${file.filename}`,
    fileName: file.originalname,
    date: new Date().toISOString(),
  };
  db.radios.push(newRadio);
  writeData(db);
  return newRadio;
}

function listAppointments() {
  return readData().appointments || [];
}

function upsertAppointments({ appointment, cancelIds }) {
  const db = readData();
  if (!db.appointments) db.appointments = [];

  if (Array.isArray(cancelIds) && cancelIds.length > 0) {
    db.appointments = db.appointments.map(apt =>
      cancelIds.includes(apt.id) ? { ...apt, status: 'canceled' } : apt
    );
  }

  if (appointment.id) {
    const index = db.appointments.findIndex(a => a.id === appointment.id);
    if (index !== -1) {
      db.appointments[index] = { ...db.appointments[index], ...appointment };
    }
  } else {
    db.appointments.push({
      ...appointment,
      id: randomId(),
      createdAt: new Date().toISOString(),
      status: appointment.status || 'pending',
    });
  }

  writeData(db);
  return db.appointments;
}

function restoreAppointment(id) {
  const db = readData();
  const index = (db.appointments || []).findIndex(a => a.id === id);
  if (index === -1) return { error: { status: 404, message: 'Appointment not found' } };
  db.appointments[index].status = 'pending';
  writeData(db);
  return { data: db.appointments };
}

function listInvoices() {
  return readData().invoices || [];
}

function createInvoice(payload) {
  const db = readData();
  if (!db.invoices) db.invoices = [];
  const newInvoice = { ...payload, id: randomId() };
  db.invoices.push(newInvoice);
  writeData(db);
  return newInvoice;
}

function updateInvoice(id, patch) {
  const db = readData();
  if (!db.invoices) db.invoices = [];
  const index = db.invoices.findIndex(i => i.id === id);
  if (index === -1) return { error: { status: 404, message: 'Invoice not found' } };
  db.invoices[index] = { ...db.invoices[index], ...patch };
  writeData(db);
  return { data: db.invoices[index] };
}

module.exports = {
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  listRadios,
  addRadio,
  listAppointments,
  upsertAppointments,
  restoreAppointment,
  listInvoices,
  createInvoice,
  updateInvoice,
};
