// Pure-ish service helpers that exercise the local JSON DB.
// These exist to make routes thinner and more testable.
const { readData, writeData } = require('../db');

const randomId = () => Math.random().toString(36).slice(2, 11);

function listClinics() {
  const db = readData();
  return db.clinics || [];
}

function getStats() {
  const db = readData();
  return {
    totalClinics: (db.clinics || []).length,
    totalUsers: (db.users || []).length,
    activeSubscriptions: (db.clinics || []).filter(c => c.subscriptionStatus === 'active').length,
  };
}

function createClinicWithAdmin({ name, address, adminEmail, adminName, adminPassword }) {
  const db = readData();
  if (db.users.find(u => u.email === adminEmail)) {
    return { error: { status: 400, message: 'Admin email already exists' } };
  }

  const newClinic = {
    id: randomId(),
    name,
    address,
    maxStaff: 5,
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString(),
  };
  const newAdmin = {
    id: randomId(),
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: 'clinic_admin',
    clinicId: newClinic.id,
  };
  if (!db.clinics) db.clinics = [];
  db.clinics.push(newClinic);
  db.users.push(newAdmin);
  writeData(db);
  return { data: { clinic: newClinic, admin: newAdmin } };
}

function updateClinic(id, patch) {
  const db = readData();
  const index = (db.clinics || []).findIndex(c => c.id === id);
  if (index === -1) return { error: { status: 404, message: 'Clinic not found' } };
  db.clinics[index] = { ...db.clinics[index], ...patch };
  writeData(db);
  return { data: db.clinics[index] };
}

function deleteClinicCascade(id) {
  const db = readData();
  db.clinics = (db.clinics || []).filter(c => c.id !== id);
  db.users = (db.users || []).filter(u => u.clinicId !== id);
  db.patients = (db.patients || []).filter(p => p.clinicId !== id);
  writeData(db);
  return { data: { success: true } };
}

function listClinicUsers(clinicId) {
  const db = readData();
  const users = (db.users || []).filter(u => u.clinicId === clinicId);
  return users.map(({ password, ...u }) => u);
}

function resetUserPassword(userId, password) {
  const db = readData();
  const user = db.users.find(u => u.id === userId);
  if (!user) return { error: { status: 404, message: 'User not found' } };
  user.password = password;
  writeData(db);
  return { data: { success: true } };
}

function createClinicUser(clinicId, { email, password, name, role }) {
  const db = readData();
  const clinic = (db.clinics || []).find(c => c.id === clinicId);
  if (!clinic) return { error: { status: 404, message: 'Clinic not found' } };
  if (db.users.find(u => u.email === email)) {
    return { error: { status: 400, message: 'User already exists' } };
  }
  const newUser = {
    id: randomId(),
    email,
    password,
    name,
    role: role || 'assistant',
    clinicId: clinic.id,
  };
  db.users.push(newUser);
  writeData(db);
  return { data: newUser };
}

function updateUser(id, { name, email }) {
  const db = readData();
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return { error: { status: 404, message: 'User not found' } };
  db.users[index] = { ...db.users[index], name, email };
  writeData(db);
  const { password, ...safeUser } = db.users[index];
  return { data: safeUser };
}

function deleteUser(id) {
  const db = readData();
  db.users = db.users.filter(u => u.id !== id);
  writeData(db);
  return { data: { success: true } };
}

function changeUserRole(id, role) {
  const db = readData();
  const user = db.users.find(u => u.id === id);
  if (!user) return { error: { status: 404, message: 'User not found' } };
  user.role = role;
  writeData(db);
  const { password, ...safeUser } = user;
  return { data: safeUser };
}

module.exports = {
  listClinics,
  getStats,
  createClinicWithAdmin,
  updateClinic,
  deleteClinicCascade,
  listClinicUsers,
  resetUserPassword,
  createClinicUser,
  updateUser,
  deleteUser,
  changeUserRole,
};
