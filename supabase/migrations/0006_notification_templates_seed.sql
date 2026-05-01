-- =============================================================
-- 0006_notification_templates_seed.sql — Phase 3.7 default
-- notification templates. Four rows: appointment_reminder and
-- payment_reminder, in English and French, channel='email'.
-- =============================================================

INSERT INTO notification_templates (key, locale, channel, subject, body)
VALUES
  (
    'appointment_reminder',
    'en',
    'email',
    'Reminder: your appointment on {{date}}',
    E'Hi {{patient_name}},\n\n' ||
    E'This is a friendly reminder that you have an appointment with ' ||
    E'{{clinic_name}} on {{date}} at {{time}}.\n\n' ||
    E'If you need to reschedule, please reply to this email or call ' ||
    E'{{clinic_phone}}.\n\n' ||
    E'See you soon,\n{{clinic_name}}'
  ),
  (
    'appointment_reminder',
    'fr',
    'email',
    'Rappel : votre rendez-vous le {{date}}',
    E'Bonjour {{patient_name}},\n\n' ||
    E'Petit rappel : vous avez rendez-vous avec ' ||
    E'{{clinic_name}} le {{date}} à {{time}}.\n\n' ||
    E'Pour reporter, répondez à cet e-mail ou appelez le ' ||
    E'{{clinic_phone}}.\n\n' ||
    E'À très bientôt,\n{{clinic_name}}'
  ),
  (
    'payment_reminder',
    'en',
    'email',
    'Outstanding balance at {{clinic_name}}',
    E'Hi {{patient_name}},\n\n' ||
    E'Our records show an outstanding balance of {{amount}} {{currency}} ' ||
    E'on invoice {{invoice_ref}} dated {{invoice_date}}.\n\n' ||
    E'You can settle the balance at your next visit or by replying to ' ||
    E'this email.\n\n' ||
    E'Thank you,\n{{clinic_name}}'
  ),
  (
    'payment_reminder',
    'fr',
    'email',
    E'Solde impayé chez {{clinic_name}}',
    E'Bonjour {{patient_name}},\n\n' ||
    E'Nos registres indiquent un solde impayé de {{amount}} {{currency}} ' ||
    E'sur la facture {{invoice_ref}} du {{invoice_date}}.\n\n' ||
    E'Vous pouvez régler ce solde lors de votre prochaine visite ou ' ||
    E'en répondant à cet e-mail.\n\n' ||
    E'Merci,\n{{clinic_name}}'
  )
ON CONFLICT (key, locale, channel) DO UPDATE
  SET subject = EXCLUDED.subject,
      body    = EXCLUDED.body;
