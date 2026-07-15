// MSW request handlers for the unified backend API at /api/v1/*.
// Tests build on these defaults; individual tests can override per-case
// via `server.use(http.get(...))`.

import { http, HttpResponse } from 'msw';

const API = '*/api/v1';

const samplePatient = {
  id: 'p_1',
  name: 'Jane Doe',
  phone: '+212600000000',
  email: 'jane@example.com',
  status: 'active' as const,
  createdAt: new Date('2025-01-01').toISOString(),
};

export const handlers = [
  // Health
  http.get('*/api/health', () =>
    HttpResponse.json({ ok: true, version: '1.0.0' }),
  ),

  // Patients
  http.get(`${API}/patients`, () =>
    HttpResponse.json({
      data: { data: [samplePatient], page: 0, pageSize: 50, total: 1 },
    }),
  ),
  http.get(`${API}/patients/:id`, ({ params }) =>
    HttpResponse.json({ data: { ...samplePatient, id: String(params.id) } }),
  ),
  http.post(`${API}/patients`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { data: { ...samplePatient, ...body, id: 'p_new' } },
      { status: 201 },
    );
  }),

  // Appointments
  http.get(`${API}/appointments`, () =>
    HttpResponse.json({
      data: { data: [], page: 0, pageSize: 200, total: 0 },
    }),
  ),

  // Stats
  http.get(`${API}/stats/dashboard`, () =>
    HttpResponse.json({
      data: {
        activePatients: 12,
        totalAppointments: 34,
        totalInvoices: 8,
        totalTreatments: 56,
      },
    }),
  ),
  http.get(`${API}/stats/revenue`, () =>
    HttpResponse.json({
      data: { totalBilled: 10000, totalCollected: 7500, outstanding: 2500 },
    }),
  ),
];
