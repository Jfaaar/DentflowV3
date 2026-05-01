// Public auth-related routes: invitation lookup + accept.
// /api/auth/* is rate-limited at the app level.
const express = require('express');
const crypto = require('crypto');
const { supabaseAdmin } = require('../lib/supabase');
const { validate } = require('../middleware/validate');
const { acceptInvitationSchema, tokenParamSchema } = require('../schemas/auth');

const router = express.Router();

// Both /api/invitations/:token and /api/auth/invitations/:token are mounted in index.js
// to preserve the existing public surface.
router.get('/:token', validate({ params: tokenParamSchema }), async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
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
      clinic_name: invitation.clinics?.name,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error validating invitation:', err);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

router.post(
  '/:token/accept',
  validate({ params: tokenParamSchema, body: acceptInvitationSchema }),
  async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const { password, name } = req.body;

    try {
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

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || invitation.email.split('@')[0],
          role: invitation.role,
        },
      });

      if (userError) {
        return res.status(400).json({ error: userError.message });
      }

      await supabaseAdmin.from('profiles').upsert({
        id: userData.user.id,
        name: name || invitation.email.split('@')[0],
        role: invitation.role,
        clinic_id: invitation.clinic_id,
      }, { onConflict: 'id' });

      await supabaseAdmin.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id);

      res.json({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          name: name || invitation.email.split('@')[0],
          role: invitation.role,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error accepting invitation:', err);
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  }
);

router.generateToken = () => crypto.randomBytes(32).toString('hex');

module.exports = router;
