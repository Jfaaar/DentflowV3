const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// In-Memory fallback if FS is not writable (common in cloud sandboxes)
let MEMORY_DB = null;
let USE_MEMORY = false;

const initialData = {
  clinics: [
    {
      id: 'c1',
      name: 'Default Clinic',
      address: '123 Smile St',
      maxStaff: 5,
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString()
    }
  ],
  users: [
    { id: 'u0', email: 'admin@dentflow.com', name: 'Super Admin', role: 'super_admin', password: 'admin' },
    { id: 'u1', email: 'assistant@clinic.com', name: 'Dr. Assistant', role: 'assistant', clinicId: 'c1', password: 'password' },
    { id: 'u2', email: 'demo', name: 'Demo Doctor', role: 'clinic_admin', clinicId: 'c1', password: 'demo' }
  ],
  patients: [
    { id: 'p1', name: 'Sarah Connor', phone: '555-0199', email: 'sarah@example.com', clinicId: 'c1' },
    { id: 'p2', name: 'John Wick', phone: '555-0122', email: 'john@continental.com', clinicId: 'c1' }
  ],
  appointments: [],
  invoices: []
};

const initializeDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    } else {
      // Validate existing data structure
      const fileContent = fs.readFileSync(DB_FILE, 'utf-8');

      // If empty file, write initial data
      if (!fileContent || fileContent.trim() === '') {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return;
      }

      let data = JSON.parse(fileContent);
      let changed = false;

      if (!data.invoices) {
        data.invoices = [];
        changed = true;
      }
      if (!data.patients) {
        data.patients = [];
        changed = true;
      }

      // Ensure demo user exists
      if (!data.users || !data.users.find(u => u.email === 'demo')) {
        if (!data.users) data.users = [];
        data.users.push({ id: 'u2', email: 'demo', name: 'Demo Doctor', role: 'clinic_admin', clinicId: 'c1', password: 'demo' });
        changed = true;
      }

      // Ensure Super Admin exists
      if (!data.users.find(u => u.role === 'super_admin')) {
        data.users.push({ id: 'u0', email: 'admin@dentflow.com', name: 'Super Admin', role: 'super_admin', password: 'admin' });
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      }
    }
  } catch (err) {
    console.warn("DB File Corrupt or Unwritable. Resetting/Switching to Memory.", err.message);

    // Try to reset the file if it was a parse error
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    } catch (writeErr) {
      // If we can't write, switch to memory
      USE_MEMORY = true;
      MEMORY_DB = JSON.parse(JSON.stringify(initialData));
    }
  }
};

initializeDB();

const readData = () => {
  if (USE_MEMORY) return MEMORY_DB;

  try {
    if (!fs.existsSync(DB_FILE)) initializeDB();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("DB Read Error - Returning Safe Defaults", error);
    // If read fails, try to re-init next time or return safe default
    return initialData;
  }
};

const writeData = (data) => {
  if (USE_MEMORY) {
    MEMORY_DB = data;
    return;
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("DB Write Error, switching to memory", error);
    USE_MEMORY = true;
    MEMORY_DB = data;
  }
};

module.exports = {
  readData,
  writeData
};