import { baseApi } from '@/services/api/baseApi';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'insurance';

export interface PaymentDetail {
  id: string;
  amount: number;
  date: string;
  method?: PaymentMethod;
  note?: string;
  invoiceId: string;
  refunded: boolean;
}

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method?: PaymentMethod;
  date?: string;
  note?: string;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPayments: build.query<
      { data: PaymentDetail[]; page: number; pageSize: number; total: number },
      { invoiceId?: string; page?: number; pageSize?: number } | void
    >({
      query: (params) => ({
        url: 'payments',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: { data: { data: PaymentDetail[]; page: number; pageSize: number; total: number } }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: 'Payment' as const, id: p.id })),
              { type: 'Payment' as const, id: 'LIST' },
            ]
          : [{ type: 'Payment' as const, id: 'LIST' }],
    }),
    createPayment: build.mutation<PaymentDetail, PaymentInput>({
      query: (body) => ({ url: 'payments', method: 'POST', body }),
      transformResponse: (r: { data: PaymentDetail }) => r.data,
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Payment', id: 'LIST' },
              { type: 'Invoice', id: result.invoiceId },
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Payment', id: 'LIST' }, { type: 'Invoice', id: 'LIST' }],
    }),
    updatePayment: build.mutation<PaymentDetail, { id: string; patch: Partial<PaymentInput> }>({
      query: ({ id, patch }) => ({ url: `payments/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: PaymentDetail }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Payment', id },
        { type: 'Payment', id: 'LIST' },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    refundPayment: build.mutation<void, string>({
      query: (id) => ({ url: `payments/${id}/refund`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Payment', id },
        { type: 'Payment', id: 'LIST' },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useRefundPaymentMutation,
} = paymentsApi;
