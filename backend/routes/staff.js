// Clinic-scoped staff and invitation routes.
const express = require('express');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');
const { validate } = require('../middleware/validate');
const { audit } = require('../middleware/audit');
const { supabaseAdmin } = require('../lib/supabase');
const { readData, writeData } = require('../db');
const {
  createUserSchema,
  createInvitationSchema,
  idParamSchema,
} = require('../schemas/backoffice');

const router = express.Router();
const generateToken = () => crypto.randomBytes(32).toString('hex');
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// --- POST /api/staff (clinic_admin local-DB path; preserved for back-compat) ---
router.post(
  '/staff',
  authenticateToken,
  requireRole('clinic_admin'),
  validate({ body: createUserSchema }),
  audit('user.create', { resource: 'user' }),
  async (req, res) => {
    await delay(500);
    const { email, password, name, role } = req.body;
    const db = readData();
    const clinic = (db.clinics || []).find(c => c.id === req.user.clinicId);
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });

    const currentStaff = db.users.filter(u => u.clinicId === clinic.id).length;
    if (currentStaff >= clinic.maxStaff) {
      return res.status(400).json({ error: 'Staff limit reached. Upgrade subscription.' });
    }
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
      id: Math.random().toString(36).slice(2, 11),
      email,
      password,
      name,
      role,
      clinicId: clinic.id,
    };
    db.users.push(newUser);
    writeData(db);
    res.json(newUser);
  }
);

// --- /api/clinic/* (Supabase-backed) ---

router.get(
  '/clinic/staff',
  authenticateToken,
  requireRole('clinic_admin', 'super_admin'),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('clinic_id')
        .eq('id', req.user.id)
        .single();
      if (!profile?.clinic_id) {
        return res.status(400).json({ error: 'User not assigned to a clinic' });
      }
      const { data: staff, error } = await supabaseAdmin
        .from('profiles')
        .select('id, name, role, avatar, created_at')
        .eq('clinic_id', profile.clinic_id);
      if (error) return res.status(400).json({ error: error.message });
      res.json(staff);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error listing staff:', err);
      res.status(500).json({ error: 'Failed to list staff' });
    }
  }
);

router.post(
  '/clinic/invitations',
  authenticateToken,
  requireRole('clinic_admin', 'super_admin'),
  validate({ body: createInvitationSchema }),
  audit('invitation.create', { resource: 'invitation' }),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const { email, role } = req.body;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('clinic_id')
        .eq('id', req.user.id)
        .single();
      if (!profile?.clinic_id) {
        return res.status(400).json({ error: 'User not assigned to a clinic' });
      }

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

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { data: invitation, error } = await supabaseAdmin
        .from('invitations')
        .insert({
          clinic_id: profile.clinic_id,
          email,
          role,
          invited_by: req.user.id,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });

      const { data: clinic } = await supabaseAdmin
        .from('clinics')
        .select('name')
        .eq('id', profile.clinic_id)
        .single();

      const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invite?token=${token}`;
      res.json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl,
        clinic_name: clinic?.name,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating invitation:', err);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  }
);

router.get(
  '/clinic/invitations',
  authenticateToken,
  requireRole('clinic_admin', 'super_admin'),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
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
      if (error) return res.status(400).json({ error: error.message });
      res.json(invitations);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error listing invitations:', err);
      res.status(500).json({ error: 'Failed to list invitations' });
    }
  }
);

router.delete(
  '/clinic/staff/:id',
  authenticateToken,
  requireRole('clinic_admin', 'super_admin'),
  validate({ params: idParamSchema }),
  audit('user.delete', { resource: 'user', resourceIdFrom: 'params', resourceIdParam: 'id' }),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    try {
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

      const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error removing staff:', err);
      res.status(500).json({ error: 'Failed to remove staff' });
    }
  }
);

module.exports = router;
