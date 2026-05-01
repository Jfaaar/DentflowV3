/**
 * Treatment plans service.
 *
 * A treatment plan is a list of proposed line items the doctor draws up for a
 * patient. Plans go draft -> proposed -> accepted/rejected -> completed.
 *
 * Convenience operations:
 *  - accept(id): mark as accepted, set acceptedAt = NOW()
 *  - convertToAppointments(id): bulk-insert appointments scaffolding (one per
 *    item, requires a base date provided by the caller)
 *  - convertToInvoice(id): create an invoice + invoice_items (one per item)
 */
import { supabase } from '../supabase';
import type {
  TreatmentPlan, TreatmentPlanItem, TreatmentPlanStatus,
  Appointment, Invoice,
} from '../../types';

const PLANS = 'treatment_plans';
const ITEMS = 'treatment_plan_items';

interface PlanRow {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  title: string;
  notes?: string | null;
  status: TreatmentPlanStatus;
  total: number;
  accepted_at?: string | null;
  clinic_id: string;
  created_at: string;
}

interface ItemRow {
  id: string;
  plan_id: string;
  tooth_id?: string | null;
  description: string;
  price: number;
  quantity: number;
  estimated_duration?: number | null;
  status?: 'planned' | 'completed' | null;
}

const fromPlan = (r: PlanRow, items?: TreatmentPlanItem[]): TreatmentPlan => ({
  id: r.id,
  patientId: r.patient_id,
  patientName: r.patient_name ?? undefined,
  title: r.title,
  notes: r.notes ?? undefined,
  status: r.status,
  total: Number(r.total) || 0,
  acceptedAt: r.accepted_at ?? null,
  clinicId: r.clinic_id,
  createdAt: r.created_at,
  items,
});

const fromItem = (r: ItemRow): TreatmentPlanItem => ({
  id: r.id,
  planId: r.plan_id,
  toothId: r.tooth_id ?? undefined,
  description: r.description,
  price: Number(r.price) || 0,
  quantity: Number(r.quantity) || 1,
  estimatedDuration: r.estimated_duration ?? undefined,
  status: r.status ?? undefined,
});

const recomputeTotal = (items: TreatmentPlanItem[]): number =>
  items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

export const treatmentPlansService = {
  async list(patientId?: string): Promise<TreatmentPlan[]> {
    let q = supabase.from(PLANS).select('*').order('created_at', { ascending: false });
    if (patientId) q = q.eq('patient_id', patientId);
    const { data, error } = await q;
    if (error) throw error;
    return (data as PlanRow[] | null)?.map(p => fromPlan(p)) ?? [];
  },

  async get(id: string): Promise<TreatmentPlan | null> {
    const { data: planRow, error } = await supabase.from(PLANS).select('*').eq('id', id).single();
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    const { data: itemRows, error: ie } = await supabase
      .from(ITEMS).select('*').eq('plan_id', id).order('created_at', { ascending: true });
    if (ie) throw ie;
    return fromPlan(planRow as PlanRow, (itemRows as ItemRow[] | null)?.map(fromItem) ?? []);
  },

  async create(plan: Omit<TreatmentPlan, 'id' | 'createdAt' | 'total'> & { total?: number }): Promise<TreatmentPlan> {
    const row = {
      patient_id: plan.patientId,
      patient_name: plan.patientName ?? null,
      title: plan.title,
      notes: plan.notes ?? null,
      status: plan.status || 'draft',
      total: plan.total ?? 0,
      accepted_at: plan.acceptedAt ?? null,
      clinic_id: plan.clinicId,
    };
    const { data, error } = await supabase.from(PLANS).insert(row).select().single();
    if (error) throw error;
    return fromPlan(data as PlanRow);
  },

  async update(id: string, patch: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    const row: Record<string, any> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.notes !== undefined) row.notes = patch.notes ?? null;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.total !== undefined) row.total = patch.total;
    if (patch.acceptedAt !== undefined) row.accepted_at = patch.acceptedAt;
    const { data, error } = await supabase.from(PLANS).update(row).eq('id', id).select().single();
    if (error) throw error;
    return fromPlan(data as PlanRow);
  },

  async addItem(planId: string, item: Omit<TreatmentPlanItem, 'id' | 'planId'>): Promise<TreatmentPlanItem> {
    const row = {
      plan_id: planId,
      tooth_id: item.toothId ?? null,
      description: item.description,
      price: item.price,
      quantity: item.quantity ?? 1,
      estimated_duration: item.estimatedDuration ?? null,
      status: item.status ?? 'planned',
    };
    const { data, error } = await supabase.from(ITEMS).insert(row).select().single();
    if (error) throw error;
    const created = fromItem(data as ItemRow);

    // Refresh total
    const items = await fetchItems(planId);
    await supabase.from(PLANS).update({ total: recomputeTotal(items) }).eq('id', planId);

    return created;
  },

  async updateItem(itemId: string, patch: Partial<TreatmentPlanItem>): Promise<TreatmentPlanItem> {
    const row: Record<string, any> = {};
    if (patch.toothId !== undefined) row.tooth_id = patch.toothId ?? null;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.quantity !== undefined) row.quantity = patch.quantity;
    if (patch.estimatedDuration !== undefined) row.estimated_duration = patch.estimatedDuration;
    if (patch.status !== undefined) row.status = patch.status;
    const { data, error } = await supabase.from(ITEMS).update(row).eq('id', itemId).select().single();
    if (error) throw error;
    const updated = fromItem(data as ItemRow);

    // Refresh total of the parent plan
    const planId = updated.planId;
    const items = await fetchItems(planId);
    await supabase.from(PLANS).update({ total: recomputeTotal(items) }).eq('id', planId);

    return updated;
  },

  async removeItem(itemId: string): Promise<void> {
    const { data: itemRow } = await supabase.from(ITEMS).select('plan_id').eq('id', itemId).single();
    const { error } = await supabase.from(ITEMS).delete().eq('id', itemId);
    if (error) throw error;
    if (itemRow?.plan_id) {
      const items = await fetchItems(itemRow.plan_id);
      await supabase.from(PLANS).update({ total: recomputeTotal(items) }).eq('id', itemRow.plan_id);
    }
  },

  /** Mark plan accepted and stamp acceptedAt = NOW(). */
  async accept(id: string): Promise<TreatmentPlan> {
    const { data, error } = await supabase
      .from(PLANS)
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return fromPlan(data as PlanRow);
  },

  async reject(id: string): Promise<TreatmentPlan> {
    const { data, error } = await supabase
      .from(PLANS).update({ status: 'rejected' }).eq('id', id).select().single();
    if (error) throw error;
    return fromPlan(data as PlanRow);
  },

  /**
   * Bulk-insert appointment scaffolding for an accepted plan.
   * The caller provides a baseDate; one appointment per item is created at
   * baseDate + N * defaultGap (default 7 days).
   */
  async convertToAppointments(
    id: string,
    opts: { baseDate?: string; gapDays?: number; defaultDurationMin?: number } = {}
  ): Promise<Appointment[]> {
    const plan = await this.get(id);
    if (!plan) throw new Error('Plan not found');

    const base = opts.baseDate ? new Date(opts.baseDate) : new Date();
    const gap = opts.gapDays ?? 7;
    const dur = opts.defaultDurationMin ?? 30;

    const rows = (plan.items ?? []).map((it, idx) => {
      const start = new Date(base);
      start.setDate(start.getDate() + idx * gap);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + (it.estimatedDuration ?? dur));
      return {
        patient_id: plan.patientId,
        patient_name: plan.patientName ?? null,
        start: start.toISOString(),
        end: end.toISOString(),
        status: 'pending',
        observation: it.description,
        clinic_id: plan.clinicId,
      };
    });

    if (rows.length === 0) return [];
    const { data, error } = await supabase.from('appointments').insert(rows).select();
    if (error) throw error;
    return (data as any[]).map((r): Appointment => ({
      id: r.id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      start: r.start,
      end: r.end,
      status: r.status,
      observation: r.observation ?? undefined,
      createdAt: r.created_at,
    }));
  },

  /**
   * Build an invoice + invoice_items from a plan. Returns the new invoice.
   */
  async convertToInvoice(id: string): Promise<Invoice> {
    const plan = await this.get(id);
    if (!plan) throw new Error('Plan not found');
    const items = plan.items ?? [];
    const total = recomputeTotal(items);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        patient_id: plan.patientId,
        patient_name: plan.patientName ?? null,
        amount: total,
        paid_amount: 0,
        status: 'unpaid',
        date: new Date().toISOString(),
        clinic_id: plan.clinicId,
        treatment_plan_id: plan.id,
      })
      .select()
      .single();
    if (error) throw error;

    if (items.length > 0) {
      const lineItems = items.map(it => ({
        invoice_id: (invoice as any).id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.price,
        total: it.price * it.quantity,
        clinic_id: plan.clinicId,
      }));
      const { error: ie } = await supabase.from('invoice_items').insert(lineItems);
      if (ie) throw ie;
    }

    const inv: Invoice = {
      id: (invoice as any).id,
      appointmentId: '',
      patientId: plan.patientId,
      patientName: plan.patientName ?? '',
      amount: total,
      paidAmount: 0,
      payments: [],
      status: 'unpaid',
      date: (invoice as any).date,
    };
    return inv;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(PLANS).delete().eq('id', id);
    if (error) throw error;
  },
};

async function fetchItems(planId: string): Promise<TreatmentPlanItem[]> {
  const { data } = await supabase.from(ITEMS).select('*').eq('plan_id', planId);
  return (data as ItemRow[] | null)?.map(fromItem) ?? [];
}
