// Backoffice (super_admin) routes: clinics, users, stats, customers.
const express = require('express');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const { audit } = require('../middleware/audit');
const { supabaseAdmin } = require('../lib/supabase');
const clinicService = require('../services/clinicService');
const {
  createClinicSchema,
  updateClinicSchema,
  adminCreateClinicSchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  roleChangeSchema,
  adminCreateCustomerSchema,
  idParamSchema,
} = require('../schemas/backoffice');

const router = express.Router();
const generateToken = () => crypto.randomBytes(32).toString('hex');

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// ----------------- /api/backoffice -----------------

router.post(
  '/backoffice/clinics',
  authenticateToken,
  requireRole('super_admin'),
  validate({ body: createClinicSchema }),
  audit('clinic.create', { resource: 'clinic' }),
  async (req, res) => {
    await delay(500);
    const result = clinicService.createClinicWithAdmin(req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

router.get(
  '/backoffice/clinics',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    await delay(300);
    res.json(clinicService.listClinics());
  }
);

router.put(
  '/backoffice/clinics/:id',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema, body: updateClinicSchema }),
  audit('clinic.update', { resource: 'clinic', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    await delay(300);
    const result = clinicService.updateClinic(req.params.id, req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

router.delete(
  '/backoffice/clinics/:id',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema }),
  audit('clinic.delete', { resource: 'clinic', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    await delay(500);
    const result = clinicService.deleteClinicCascade(req.params.id);
    res.json(result.data);
  }
);

router.get(
  '/backoffice/stats',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    res.json(clinicService.getStats());
  }
);

router.get(
  '/backoffice/clinics/:id/users',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema }),
  async (req, res) => {
    await delay(200);
    res.json(clinicService.listClinicUsers(req.params.id));
  }
);

router.post(
  '/backoffice/users/:id/reset-password',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema, body: resetPasswordSchema }),
  audit('user.reset-password', { resource: 'user', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    await delay(300);
    const result = clinicService.resetUserPassword(req.params.id, req.body.password);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

router.post(
  '/backoffice/clinics/:id/users',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema, body: createUserSchema }),
  audit('user.create', { resource: 'user' }),
  async (req, res) => {
    await delay(300);
    const result = clinicService.createClinicUser(req.params.id, req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

router.put(
  '/backoffice/users/:id',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema, body: updateUserSchema }),
  audit('user.update', { resource: 'user', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    await delay(300);
    const result = clinicService.updateUser(req.params.id, req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

router.delete(
  '/backoffice/users/:id',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema }),
  audit('user.delete', { resource: 'user', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    await delay(300);
    res.json(clinicService.deleteUser(req.params.id).data);
  }
);

router.put(
  '/backoffice/users/:id/role',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema, body: roleChangeSchema }),
  audit('user.role-change', { resource: 'user', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    await delay(300);
    const result = clinicService.changeUserRole(req.params.id, req.body.role);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json(result.data);
  }
);

// ----------------- /api/admin (Supabase-backed) -----------------

router.post(
  '/admin/customers',
  authenticateToken,
  requireRole('super_admin'),
  validate({ body: adminCreateCustomerSchema }),
  audit('user.create', { resource: 'user' }),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const { email, name, role } = req.body;
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0], role: role || 'doctor' },
      });
      if (error) return res.status(400).json({ error: error.message });

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: name || email.split('@')[0],
          role: role || 'doctor',
        }, { onConflict: 'id' });

      if (profileError) {
        // eslint-disable-next-line no-console
        console.log('Profile creation note:', profileError.message);
      }

      res.json({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email,
        role: data.user.user_metadata?.role || 'doctor',
        created_at: data.user.created_at,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', err);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
);

router.get(
  '/admin/customers',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) return res.status(400).json({ error: error.message });
      const customers = data.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
        role: user.user_metadata?.role || 'doctor',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        provider: user.app_metadata?.provider || 'email',
      }));
      res.json(customers);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error listing customers:', err);
      res.status(500).json({ error: 'Failed to list customers' });
    }
  }
);

router.delete(
  '/admin/customers/:id',
  authenticateToken,
  requireRole('super_admin'),
  validate({ params: idParamSchema }),
  audit('user.delete', { resource: 'user', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error deleting customer:', err);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }
);

router.post(
  '/admin/clinics',
  authenticateToken,
  requireRole('super_admin'),
  validate({ body: adminCreateClinicSchema }),
  audit('clinic.create', { resource: 'clinic' }),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const { name, address, phone, adminEmail, adminName } = req.body;
    try {
      const { data: clinic, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert({ name, email: adminEmail, address, phone })
        .select()
        .single();
      if (clinicError) return res.status(400).json({ error: clinicError.message });

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        email_confirm: true,
        user_metadata: { name: adminName || adminEmail.split('@')[0], role: 'clinic_admin' },
      });
      if (userError) {
        await supabaseAdmin.from('clinics').delete().eq('id', clinic.id);
        return res.status(400).json({ error: userError.message });
      }

      await supabaseAdmin.from('profiles').upsert({
        id: userData.user.id,
        name: adminName || adminEmail.split('@')[0],
        role: 'clinic_admin',
        clinic_id: clinic.id,
      }, { onConflict: 'id' });

      res.json({
        clinic: {
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          address: clinic.address,
          phone: clinic.phone,
          subscription_status: clinic.subscription_status,
          created_at: clinic.created_at,
        },
        admin: {
          id: userData.user.id,
          email: userData.user.email,
          name: adminName || adminEmail.split('@')[0],
          role: 'clinic_admin',
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating clinic:', err);
      res.status(500).json({ error: 'Failed to create clinic' });
    }
  }
);

router.get(
  '/admin/clinics',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    try {
      const { data: clinics, error } = await supabaseAdmin
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      res.json(clinics);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error listing clinics:', err);
      res.status(500).json({ error: 'Failed to list clinics' });
    }
  }
);

router._generateInvitationToken = generateToken;
module.exports = router;
