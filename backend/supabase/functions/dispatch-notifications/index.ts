// @ts-nocheck
// -----------------------------------------------------------------------------
// dispatch-notifications — Supabase Edge Function (Deno)
//
// Cron handler that drains the `notifications` queue. Runs every minute
// (see README for deploy command).
//
// Phase 3 stubs the actual delivery: instead of calling a real provider
// (Resend / Twilio / WhatsApp Cloud API / FCM), we resolve the matching
// `notification_templates` row, log a single line per notification, then
// mark the row `status='sent'` with `sent_at = now()`. Rows that fail
// resolution or update are flagged `status='failed'` with the message
// captured in `error`.
// -----------------------------------------------------------------------------

import { serviceClient } from '../_shared/supabase.ts';

interface NotificationRow {
  id: string;
  clinic_id: string | null;
  recipient_user_id: string | null;
  patient_id: string | null;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  template_key: string;
  payload: Record<string, unknown> | null;
  status: 'queued' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string;
}

interface TemplateRow {
  key: string;
  locale: string;
  channel: string;
  subject: string | null;
  body: string;
}

const BATCH_SIZE = 50;

const renderTemplate = (
  template: string,
  payload: Record<string, unknown> | null,
): string => {
  if (!payload) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    const v = (payload as Record<string, unknown>)[k];
    return v === undefined || v === null ? '' : String(v);
  });
};

const fetchTemplate = async (
  key: string,
  channel: string,
  locale = 'en',
): Promise<TemplateRow | null> => {
  // Try requested locale first, then fall back to 'en'.
  const { data: exact } = await serviceClient
    .from('notification_templates')
    .select('*')
    .eq('key', key)
    .eq('channel', channel)
    .eq('locale', locale)
    .maybeSingle();

  if (exact) return exact as TemplateRow;

  const { data: fallback } = await serviceClient
    .from('notification_templates')
    .select('*')
    .eq('key', key)
    .eq('channel', channel)
    .eq('locale', 'en')
    .maybeSingle();

  return (fallback as TemplateRow | null) ?? null;
};

const markSent = async (id: string) => {
  const { error } = await serviceClient
    .from('notifications')
    .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
    .eq('id', id);
  if (error) console.error('[dispatch] markSent failed', id, error.message);
};

const markFailed = async (id: string, message: string) => {
  const { error } = await serviceClient
    .from('notifications')
    .update({ status: 'failed', error: message })
    .eq('id', id);
  if (error) console.error('[dispatch] markFailed failed', id, error.message);
};

/**
 * Stub delivery — log instead of actually sending. Replace with provider
 * SDK calls (Resend / Twilio / WhatsApp Cloud / FCM) in Phase 5.
 */
const deliverStub = (
  row: NotificationRow,
  template: TemplateRow,
  rendered: string,
) => {
  console.log(
    `[dispatch] (stub) channel=${row.channel} template=${row.template_key} ` +
      `locale=${template.locale} recipient_user=${row.recipient_user_id ?? '-'} ` +
      `patient=${row.patient_id ?? '-'} subject=${template.subject ?? '-'} ` +
      `body=${rendered.replace(/\s+/g, ' ').slice(0, 200)}`,
  );
};

const processBatch = async (): Promise<{ processed: number; failed: number }> => {
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await serviceClient
    .from('notifications')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[dispatch] failed to fetch queued rows', error.message);
    return { processed: 0, failed: 0 };
  }

  const queued = (rows ?? []) as NotificationRow[];
  let processed = 0;
  let failed = 0;

  for (const row of queued) {
    try {
      const locale =
        (row.payload &&
          typeof (row.payload as Record<string, unknown>).locale === 'string'
          ? ((row.payload as Record<string, unknown>).locale as string)
          : 'en');

      const template = await fetchTemplate(row.template_key, row.channel, locale);
      if (!template) {
        await markFailed(
          row.id,
          `No template for key=${row.template_key} channel=${row.channel}`,
        );
        failed += 1;
        continue;
      }

      const rendered = renderTemplate(template.body, row.payload);
      deliverStub(row, template, rendered);
      await markSent(row.id);
      processed += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[dispatch] processing error', row.id, msg);
      await markFailed(row.id, msg);
      failed += 1;
    }
  }

  return { processed, failed };
};

Deno.serve(async (_req) => {
  const started = Date.now();
  const { processed, failed } = await processBatch();
  const ms = Date.now() - started;
  const summary = { processed, failed, ms };
  console.log('[dispatch] done', JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    headers: { 'content-type': 'application/json' },
  });
});
