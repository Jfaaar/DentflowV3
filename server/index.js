const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { readData, writeData } = require('./db');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Supabase Admin Client (for admin operations like createUser)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client for admin operations (createUser, listUsers, etc.)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Regular client for token validation
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- File Upload Setup (Multer) ---
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'radios');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'radio-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper to simulate network latency for realism
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// --- SUPABASE TOKEN AUTHENTICATION MIDDLEWARE ---
// All auth (login, register) is handled by Supabase on frontend
// This middleware validates Supabase access tokens for API routes

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      console.error('Auth error:', error?.message);
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Fetch the user's profile to get role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'assistant',
      name: profile?.name || user.email
    };

    next();
  } catch (err) {
    console.error('Token validation error:', err);
    return res.status(500).json({ error: 'Auth server error' });
  }
};

// --- BACKOFFICE (Super Admin) ---
app.post('/api/backoffice/clinics', authenticateToken, async (req, res) => {
  await delay(500);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const { name, address, adminEmail, adminName, adminPassword } = req.body;
  const db = readData();

  // Check if user exists
  if (db.users.find(u => u.email === adminEmail)) {
    return res.status(400).json({ error: 'Admin email already exists' });
  }

  const newClinic = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    address,
    maxStaff: 5, // Default
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString()
  };

  const newAdmin = {
    id: Math.random().toString(36).substr(2, 9),
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: 'clinic_admin',
    clinicId: newClinic.id
  };

  if (!db.clinics) db.clinics = [];
  db.clinics.push(newClinic);
  db.users.push(newAdmin);
  writeData(db);

  res.json({ clinic: newClinic, admin: newAdmin });
});

app.get('/api/backoffice/clinics', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);
  const db = readData();
  res.json(db.clinics || []);
});

app.put('/api/backoffice/clinics/:id', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const db = readData();
  const index = (db.clinics || []).findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Clinic not found' });

  db.clinics[index] = { ...db.clinics[index], ...req.body };
  writeData(db);
  res.json(db.clinics[index]);
});

app.delete('/api/backoffice/clinics/:id', authenticateToken, async (req, res) => {
  await delay(500);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const db = readData();
  // Delete clinic
  db.clinics = (db.clinics || []).filter(c => c.id !== req.params.id);
  // Delete associated users
  db.users = (db.users || []).filter(u => u.clinicId !== req.params.id);
  // Delete associated patients
  db.patients = (db.patients || []).filter(p => p.clinicId !== req.params.id);

  writeData(db);
  res.json({ success: true });
});

app.get('/api/backoffice/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.sendStatus(403);
  const db = readData();
  res.json({
    totalClinics: (db.clinics || []).length,
    totalUsers: (db.users || []).length,
    activeSubscriptions: (db.clinics || []).filter(c => c.subscriptionStatus === 'active').length
  });
});

app.get('/api/backoffice/clinics/:id/users', authenticateToken, async (req, res) => {
  await delay(200);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);
  const db = readData();
  const users = (db.users || []).filter(u => u.clinicId === req.params.id);
  // Remove passwords before sending
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

app.post('/api/backoffice/users/:id/reset-password', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const { password } = req.body;
  const db = readData();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = password;
  writeData(db);
  res.json({ success: true });
});

app.post('/api/backoffice/clinics/:id/users', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const { email, password, name, role } = req.body;
  const db = readData();
  const clinic = (db.clinics || []).find(c => c.id === req.params.id);

  if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password,
    name,
    role: role || 'assistant',
    clinicId: clinic.id
  };

  db.users.push(newUser);
  writeData(db);
  res.json(newUser);
});

app.put('/api/backoffice/users/:id', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const db = readData();
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  // Only allow Name/Email update here (role/password have own routes)
  const { name, email } = req.body;
  db.users[index] = { ...db.users[index], name, email };

  writeData(db);
  const { password, ...safeUser } = db.users[index];
  res.json(safeUser);
});

app.delete('/api/backoffice/users/:id', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const db = readData();
  db.users = db.users.filter(u => u.id !== req.params.id);
  writeData(db);
  res.json({ success: true });
});

app.put('/api/backoffice/users/:id/role', authenticateToken, async (req, res) => {
  await delay(300);
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  const { role } = req.body;
  const db = readData();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role;
  writeData(db);
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// --- STAFF MANAGEMENT (Clinic Admin) ---
app.post('/api/staff', authenticateToken, async (req, res) => {
  await delay(500);
  if (req.user.role !== 'clinic_admin') return res.sendStatus(403);

  const { email, password, name, role } = req.body;
  const db = readData();

  const clinic = (db.clinics || []).find(c => c.id === req.user.clinicId);
  if (!clinic) return res.status(404).json({ error: 'Clinic not found' });

  // Check Limits
  const currentStaff = db.users.filter(u => u.clinicId === clinic.id).length;
  if (currentStaff >= clinic.maxStaff) {
    return res.status(400).json({ error: 'Staff limit reached. Upgrade subscription.' });
  }

  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password,
    name,
    role, // 'doctor' or 'assistant'
    clinicId: clinic.id
  };

  db.users.push(newUser);
  writeData(db);

  res.json(newUser);
});

// --- PATIENTS ---
app.get('/api/patients', async (req, res) => {
  await delay(200);
  const db = readData();
  res.json(db.patients || []);
});

app.post('/api/patients', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.patients) db.patients = [];

  const newPatient = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  db.patients.push(newPatient);
  writeData(db);
  res.json(newPatient);
});

app.put('/api/patients/:id', async (req, res) => {
  await delay(200);
  const db = readData();
  const index = db.patients.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    db.patients[index] = { ...db.patients[index], ...req.body };
    writeData(db);
    res.json(db.patients[index]);
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  await delay(200);
  const db = readData();
  db.patients = db.patients.filter(p => p.id !== req.params.id);
  writeData(db);
  res.json({ success: true });
});

// --- RADIOLOGY ---

app.get('/api/patients/:id/radios', async (req, res) => {
  await delay(200);
  const db = readData();
  // Return empty array if radios property doesn't exist yet
  const radios = (db.radios || []).filter(r => r.patientId === req.params.id);
  // Sort by date desc
  radios.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(radios);
});

app.post('/api/patients/:id/radios', upload.single('image'), async (req, res) => {
  await delay(500);
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const db = readData();
  if (!db.radios) db.radios = [];

  const newRadio = {
    id: Math.random().toString(36).substr(2, 9),
    patientId: req.params.id,
    url: `/uploads/radios/${req.file.filename}`,
    fileName: req.file.originalname,
    date: new Date().toISOString()
  };

  db.radios.push(newRadio);
  writeData(db);
  res.json(newRadio);
});

// --- APPOINTMENTS ---
app.get('/api/appointments', async (req, res) => {
  await delay(200);
  const db = readData();
  res.json(db.appointments || []);
});

app.post('/api/appointments', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.appointments) db.appointments = [];

  const { appointment, cancelIds } = req.body;

  // 1. Handle Cancels
  if (cancelIds && cancelIds.length > 0) {
    db.appointments = db.appointments.map(apt =>
      cancelIds.includes(apt.id) ? { ...apt, status: 'canceled' } : apt
    );
  }

  // 2. Handle Create or Update
  if (appointment.id) {
    const index = db.appointments.findIndex(a => a.id === appointment.id);
    if (index !== -1) {
      db.appointments[index] = { ...db.appointments[index], ...appointment };
    }
  } else {
    // Create
    const newApt = {
      ...appointment,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: appointment.status || 'pending'
    };
    db.appointments.push(newApt);
  }

  writeData(db);
  res.json(db.appointments);
});

app.put('/api/appointments/:id/restore', async (req, res) => {
  await delay(200);
  const db = readData();
  const index = db.appointments.findIndex(a => a.id === req.params.id);

  if (index !== -1) {
    db.appointments[index].status = 'pending';
    writeData(db);
    res.json(db.appointments);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// --- INVOICES ---
app.get('/api/invoices', async (req, res) => {
  await delay(200);
  const db = readData();
  res.json(db.invoices || []);
});

app.post('/api/invoices', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.invoices) db.invoices = [];

  const newInvoice = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  db.invoices.push(newInvoice);
  writeData(db);
  res.json(newInvoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.invoices) db.invoices = [];

  const index = db.invoices.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    db.invoices[index] = { ...db.invoices[index], ...req.body };
    writeData(db);
    res.json(db.invoices[index]);
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// --- ADMIN CUSTOMER MANAGEMENT (Uses Supabase Admin API) ---

// Create a new customer (pre-adds email for authentication)
app.post('/api/admin/customers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden: super_admin required' });
  }

  const { email, name, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Create user with Supabase Admin API (no password = invite-only)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0],
        role: role || 'doctor'
      }
    });

    if (error) {
      console.error('Supabase createUser error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    // Manually create profile (in case trigger doesn't exist or fails)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: data.user.id,
        name: name || email.split('@')[0],
        role: role || 'doctor'
      }, { onConflict: 'id' });

    if (profileError) {
      console.log('Profile creation note:', profileError.message);
      // Don't fail - trigger might have already created it
    }

    res.json({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email,
      role: data.user.user_metadata?.role || 'doctor',
      created_at: data.user.created_at
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// List all customers from Supabase Auth
app.get('/api/admin/customers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Transform users for frontend
    const customers = data.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      role: user.user_metadata?.role || 'doctor',
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
      provider: user.app_metadata?.provider || 'email'
    }));

    res.json(customers);
  } catch (err) {
    console.error('Error listing customers:', err);
    res.status(500).json({ error: 'Failed to list customers' });
  }
});

// Delete a customer
app.delete('/api/admin/customers/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.sendStatus(403);

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ============================================
// CLINIC MANAGEMENT ROUTES
// ============================================

const crypto = require('crypto');

// Generate a secure random token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// --- PLATFORM OWNER: Create Clinic + Admin ---
app.post('/api/admin/clinics', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden: super_admin required' });
  }

  const { name, address, phone, adminEmail, adminName } = req.body;

  if (!name || !adminEmail) {
    return res.status(400).json({ error: 'Clinic name and admin email are required' });
  }

  try {
    // 1. Create the clinic
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({ name, email: adminEmail, address, phone })
      .select()
      .single();

    if (clinicError) {
      console.error('Clinic creation error:', clinicError);
      return res.status(400).json({ error: clinicError.message });
    }

    // 2. Create the clinic admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      email_confirm: true,
      user_metadata: {
        name: adminName || adminEmail.split('@')[0],
        role: 'clinic_admin'
      }
    });

    if (userError) {
      // Rollback: delete the clinic
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id);
      console.error('Admin user creation error:', userError);
      return res.status(400).json({ error: userError.message });
    }

    // 3. Create/update the admin's profile with clinic_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        name: adminName || adminEmail.split('@')[0],
        role: 'clinic_admin',
        clinic_id: clinic.id
      }, { onConflict: 'id' });

    if (profileError) {
      console.log('Profile creation note:', profileError.message);
    }

    res.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        email: clinic.email,
        address: clinic.address,
        phone: clinic.phone,
        subscription_status: clinic.subscription_status,
        created_at: clinic.created_at
      },
      admin: {
        id: userData.user.id,
        email: userData.user.email,
        name: adminName || adminEmail.split('@')[0],
        role: 'clinic_admin'
      }
    });
  } catch (err) {
    console.error('Error creating clinic:', err);
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// --- PLATFORM OWNER: List all clinics ---
app.get('/api/admin/clinics', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: clinics, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(clinics);
  } catch (err) {
    console.error('Error listing clinics:', err);
    res.status(500).json({ error: 'Failed to list clinics' });
  }
});

// --- CLINIC ADMIN: Get clinic staff ---
app.get('/api/clinic/staff', authenticateToken, async (req, res) => {
  if (!['clinic_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Get the clinic_id from the user's profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.clinic_id) {
      return res.status(400).json({ error: 'User not assigned to a clinic' });
    }

    // Get all staff from the clinic
    const { data: staff, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role, avatar, created_at')
      .eq('clinic_id', profile.clinic_id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(staff);
  } catch (err) {
    console.error('Error listing staff:', err);
    res.status(500).json({ error: 'Failed to list staff' });
  }
});

// --- CLINIC ADMIN: Send invitation ---
app.post('/api/clinic/invitations', authenticateToken, async (req, res) => {
  if (!['clinic_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  if (!['doctor', 'assistant'].includes(role)) {
    return res.status(400).json({ error: 'Role must be doctor or assistant' });
  }

  try {
    // Get clinic_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.clinic_id) {
      return res.status(400).json({ error: 'User not assigned to a clinic' });
    }

    // Check if invitation already exists
    const { data: existing } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('clinic_id', profile.clinic_id)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .insert({
        clinic_id: profile.clinic_id,
        email,
        role,
        invited_by: req.user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get clinic name for email
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('name')
      .eq('id', profile.clinic_id)
      .single();

    // TODO: Send email with invitation link
    // For now, return the invitation URL
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invite?token=${token}`;

    res.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expires_at: invitation.expires_at,
      invite_url: inviteUrl,
      clinic_name: clinic?.name
    });
  } catch (err) {
    console.error('Error creating invitation:', err);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// --- CLINIC ADMIN: List invitations ---
app.get('/api/clinic/invitations', authenticateToken, async (req, res) => {
  if (!['clinic_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.clinic_id) {
      return res.status(400).json({ error: 'User not assigned to a clinic' });
    }

    const { data: invitations, error } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('clinic_id', profile.clinic_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(invitations);
  } catch (err) {
    console.error('Error listing invitations:', err);
    res.status(500).json({ error: 'Failed to list invitations' });
  }
});

// --- PUBLIC: Validate invitation token ---
app.get('/api/invitations/:token', async (req, res) => {
  try {
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .select('*, clinics(name)')
      .eq('token', req.params.token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({
      email: invitation.email,
      role: invitation.role,
      clinic_name: invitation.clinics?.name
    });
  } catch (err) {
    console.error('Error validating invitation:', err);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

// --- PUBLIC: Accept invitation ---
app.post('/api/invitations/:token/accept', async (req, res) => {
  const { password, name } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Get invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('*, clinics(name)')
      .eq('token', req.params.token)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin.from('invitations').update({ status: 'expired' }).eq('id', invitation.id);
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Create user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || invitation.email.split('@')[0],
        role: invitation.role
      }
    });

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // Create profile with clinic_id
    await supabaseAdmin.from('profiles').upsert({
      id: userData.user.id,
      name: name || invitation.email.split('@')[0],
      role: invitation.role,
      clinic_id: invitation.clinic_id
    }, { onConflict: 'id' });

    // Mark invitation as accepted
    await supabaseAdmin.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id);

    res.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        name: name || invitation.email.split('@')[0],
        role: invitation.role
      }
    });
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// --- CLINIC ADMIN: Remove staff ---
app.delete('/api/clinic/staff/:id', authenticateToken, async (req, res) => {
  if (!['clinic_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Verify staff is in same clinic
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id')
      .eq('id', req.user.id)
      .single();

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id, role')
      .eq('id', req.params.id)
      .single();

    if (!profile?.clinic_id || profile.clinic_id !== targetProfile?.clinic_id) {
      return res.status(403).json({ error: 'Cannot remove staff from different clinic' });
    }

    if (targetProfile.role === 'clinic_admin') {
      return res.status(400).json({ error: 'Cannot remove clinic admin' });
    }

    // Delete the user from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing staff:', err);
    res.status(500).json({ error: 'Failed to remove staff' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- Production Static Serving ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));

  // Handle React Routing, return all requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});