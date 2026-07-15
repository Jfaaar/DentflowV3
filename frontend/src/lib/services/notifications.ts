// Notifications service — stubbed. Will be re-wired against an
// /api/v1/notifications endpoint when notifications are needed again.

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'cancelled';

export interface EnqueueParams {
  recipientUserId?: string;
  patientId?: string;
  channel: NotificationChannel;
  templateKey: string;
  payload?: Record<string, unknown>;
  scheduledFor?: string;
}

const NOT_IMPLEMENTED = () =>
  Promise.reject(
    new Error('Notifications backend not configured; see backend/routes for the new endpoint.'),
  );

export const enqueue = (_params: EnqueueParams): Promise<unknown> => NOT_IMPLEMENTED();
export const list = (): Promise<unknown[]> => NOT_IMPLEMENTED();
