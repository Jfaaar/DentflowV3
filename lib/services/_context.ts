/**
 * Internal helper: resolve current user/clinic context for service calls.
 *
 * Services rely on RLS for tenant isolation but still need to populate
 * `clinic_id` on inserts (the DB doesn't auto-fill it).
 */

import { supabase } from '../supabase';

let cachedClinicId: string | null = null;
let cachedUserId: string | null = null;

interface ServiceContext {
  userId: string;
  clinicId: string;
}

const fetchProfileClinicId = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('id', userId)
    .single();
  if (error) return null;
  return (data?.clinic_id as string) ?? null;
};

export const getServiceContext = async (): Promise<ServiceContext> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  if (cachedUserId !== userId) {
    cachedClinicId = null;
    cachedUserId = userId;
  }

  if (!cachedClinicId) {
    cachedClinicId = await fetchProfileClinicId(userId);
  }
  if (!cachedClinicId) throw new Error('User has no clinic assigned');

  return { userId, clinicId: cachedClinicId };
};

export const resetServiceContext = (): void => {
  cachedClinicId = null;
  cachedUserId = null;
};

/** Used in tests / logout. */
export const __setServiceContextForTest = (ctx: { userId: string; clinicId: string } | null): void => {
  cachedUserId = ctx?.userId ?? null;
  cachedClinicId = ctx?.clinicId ?? null;
};
