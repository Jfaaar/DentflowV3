import { baseApi } from '@/services/api/baseApi';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method?: 'cash' | 'card' | 'transfer' | 'check';
  note?: string;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paidAmount: number;
  payments: Payment[];
  status: 'unpaid' | 'partial' | 'paid';
  date: string;
}

export interface InvoicesListParams {
  page?: number;
  pageSize?: number;
  patientId?: string;
  status?: Invoice['status'];
}

export interface InvoicesListResponse {
  data: Invoice[];
  page: number;
  pageSize: number;
  total: number;
}

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInvoices: build.query<InvoicesListResponse, InvoicesListParams | void>({
      query: (params) => ({
        url: 'invoices',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: { data: InvoicesListResponse }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((i) => ({ type: 'Invoice' as const, id: i.id })),
              { type: 'Invoice' as const, id: 'LIST' },
            ]
          : [{ type: 'Invoice' as const, id: 'LIST' }],
    }),
    getInvoice: build.query<Invoice, string>({
      query: (id) => ({ url: `invoices/${id}` }),
      transformResponse: (r: { data: Invoice }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: build.mutation<Invoice, Partial<Invoice>>({
      query: (body) => ({ url: 'invoices', method: 'POST', body }),
      transformResponse: (r: { data: Invoice }) => r.data,
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    updateInvoice: build.mutation<Invoice, { id: string; patch: Partial<Invoice> }>({
      query: ({ id, patch }) => ({ url: `invoices/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: Invoice }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    voidInvoice: build.mutation<void, string>({
      query: (id) => ({ url: `invoices/${id}/void`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useVoidInvoiceMutation,
} = invoicesApi;
