import { baseApi } from '@/services/api/baseApi';

export interface DashboardStats {
  activePatients: number;
  totalAppointments: number;
  totalInvoices: number;
  totalTreatments: number;
}

export interface RevenueSummary {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardStats: build.query<DashboardStats, void>({
      query: () => ({ url: 'stats/dashboard' }),
      transformResponse: (r: { data: DashboardStats }) => r.data,
      providesTags: [{ type: 'Stats', id: 'DASHBOARD' }],
    }),
    getRevenueSummary: build.query<RevenueSummary, void>({
      query: () => ({ url: 'stats/revenue' }),
      transformResponse: (r: { data: RevenueSummary }) => r.data,
      providesTags: [{ type: 'Stats', id: 'REVENUE' }],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetRevenueSummaryQuery } = dashboardApi;
