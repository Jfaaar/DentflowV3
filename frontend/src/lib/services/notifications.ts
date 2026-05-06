import { supabase } from '../supabase';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';
export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface EnqueueParams {
  /** Optional — recipient is a logged-in user (e.g. internal alert). */
  recipientUserId?: string;
  /** Optional — recipient is a patient (e.g. appointment reminder). */
  patientId?: string;
  channel: NotificationChannel;
  templateKey: string;
  payload?: Record<string, unknown>;
  /** ISO string. Defaults to now (server-side). */
  scheduledFor?: string;
}

export interface NotificationRow {
  id: string;
  clinic_id: string | null;
  recipient_user_id: string | null;
  patient_id: string | null;
  channel: NotificationChannel;
  template_key: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  scheduled_for: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------------

const getCurrentClinicId = async (): Promise<string | null> => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('id', userId)
    .single();

  return (profile?.clinic_id as string | null) ?? null;
};

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Enqueue a single notification. The Edge Function dispatcher
 * (`supabase/functions/dispatch-notifications`) picks up rows where
 * `status='queued'` and `scheduled_for <= now()` and delivers them.
 */
export const enqueue = async (
  params: EnqueueParams,
): Promise<NotificationRow> => {
  const clinicId = await getCurrentClinicId();

  const insertPayload = {
    clinic_id: clinicId,
    recipient_user_id: params.recipientUserId ?? null,
    patient_id: params.patientId ?? null,
    channel: params.channel,
    template_key: params.templateKey,
    payload: params.payload ?? {},
    scheduled_for: params.scheduledFor ?? new Date().toISOString(),
    status: 'queued' as const,
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return data as NotificationRow;
};

/**
 * Returns notifications targeting the currently signed-in user that are
 * either still queued or already sent. Useful for an in-app inbox UI.
 */
export const listForCurrentUser = async (): Promise<NotificationRow[]> => {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', userId)
    .in('status', ['queued', 'sent'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
};

export const notificationsService = { enqueue, listForCurrentUser };
