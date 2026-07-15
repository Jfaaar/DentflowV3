// Payments service — thin fetch shim over /api/v1/payments.
import { http } from '../http';
import type { Payment } from '../../types';

interface PaymentInput {
  invoiceId: string;
  amount: number;
  method?: Payment['method'];
  date?: string;
  note?: string;
}

interface PaymentDetail extends Payment {
  invoiceId: string;
  refunded: boolean;
}

interface BackendPaged {
  data: PaymentDetail[];
  page: number;
  pageSize: number;
  total: number;
}

export const paymentsService = {
  async list(opts: { invoiceId?: string; page?: number; pageSize?: number } = {}) {
    const r = await http<BackendPaged>('GET', 'payments', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<PaymentDetail>('GET', `payments/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: PaymentInput) {
    return http<PaymentDetail>('POST', 'payments', { body: input });
  },

  async update(id: string, input: Partial<PaymentInput>) {
    return http<PaymentDetail>('PUT', `payments/${id}`, { body: input });
  },

  async archive(id: string) {
    await http<void>('POST', `payments/${id}/refund`);
  },
};

export type { PaymentInput };
