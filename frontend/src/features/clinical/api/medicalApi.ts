// RTK Query slice for the medical-MVP resources: vitals, problems,
// vaccinations, body-region findings. Backed by /api/v1/medical/*.
import { baseApi } from '@/services/api/baseApi';

export interface VitalSigns {
  id: string;
  clinicId: string;
  patientId: string;
  recordedBy?: string;
  recordedAt: string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperatureC?: number;
  respiratoryRate?: number;
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  painScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProblemStatus = 'active' | 'resolved' | 'chronic' | 'inactive';
export interface Problem {
  id: string;
  clinicId: string;
  patientId: string;
  icd10Code?: string;
  icd10Label?: string;
  description?: string;
  status: ProblemStatus;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  clinicId: string;
  patientId: string;
  vaccineName: string;
  administeredDate: string;
  doseNumber?: number;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  nextDoseDate?: string;
  administeredBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BodyRegionSide = 'left' | 'right' | 'center' | 'bilateral';
export interface BodyRegionFinding {
  id: string;
  clinicId: string;
  patientId: string;
  region: string;
  side?: BodyRegionSide;
  finding: string;
  severity?: string;
  notes?: string;
  recordedAt: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

interface PageQuery {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

function unwrap<T>() {
  return (r: { data: T }) => r.data;
}

export const medicalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ─── Vital signs ─────────────────────────────────────────────────────────
    listVitals: build.query<Paged<VitalSigns>, PageQuery | void>({
      query: (params) => ({
        url: 'medical/vitals',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: unwrap<Paged<VitalSigns>>(),
      providesTags: (r) =>
        r
          ? [
              ...r.data.map((v) => ({ type: 'VitalSigns' as const, id: v.id })),
              { type: 'VitalSigns' as const, id: 'LIST' },
            ]
          : [{ type: 'VitalSigns' as const, id: 'LIST' }],
    }),
    createVital: build.mutation<VitalSigns, Partial<VitalSigns>>({
      query: (body) => ({ url: 'medical/vitals', method: 'POST', body }),
      transformResponse: unwrap<VitalSigns>(),
      invalidatesTags: [{ type: 'VitalSigns', id: 'LIST' }],
    }),
    updateVital: build.mutation<VitalSigns, { id: string; patch: Partial<VitalSigns> }>({
      query: ({ id, patch }) => ({ url: `medical/vitals/${id}`, method: 'PUT', body: patch }),
      transformResponse: unwrap<VitalSigns>(),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'VitalSigns', id },
        { type: 'VitalSigns', id: 'LIST' },
      ],
    }),
    deleteVital: build.mutation<void, string>({
      query: (id) => ({ url: `medical/vitals/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'VitalSigns', id },
        { type: 'VitalSigns', id: 'LIST' },
      ],
    }),

    // ─── Problem list ────────────────────────────────────────────────────────
    listProblems: build.query<Paged<Problem>, (PageQuery & { status?: ProblemStatus }) | void>({
      query: (params) => ({
        url: 'medical/problems',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: unwrap<Paged<Problem>>(),
      providesTags: (r) =>
        r
          ? [
              ...r.data.map((p) => ({ type: 'Problem' as const, id: p.id })),
              { type: 'Problem' as const, id: 'LIST' },
            ]
          : [{ type: 'Problem' as const, id: 'LIST' }],
    }),
    createProblem: build.mutation<Problem, Partial<Problem>>({
      query: (body) => ({ url: 'medical/problems', method: 'POST', body }),
      transformResponse: unwrap<Problem>(),
      invalidatesTags: [{ type: 'Problem', id: 'LIST' }],
    }),
    updateProblem: build.mutation<Problem, { id: string; patch: Partial<Problem> }>({
      query: ({ id, patch }) => ({ url: `medical/problems/${id}`, method: 'PUT', body: patch }),
      transformResponse: unwrap<Problem>(),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Problem', id },
        { type: 'Problem', id: 'LIST' },
      ],
    }),
    deleteProblem: build.mutation<void, string>({
      query: (id) => ({ url: `medical/problems/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Problem', id },
        { type: 'Problem', id: 'LIST' },
      ],
    }),

    // ─── Vaccinations ────────────────────────────────────────────────────────
    listVaccinations: build.query<Paged<Vaccination>, PageQuery | void>({
      query: (params) => ({
        url: 'medical/vaccinations',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: unwrap<Paged<Vaccination>>(),
      providesTags: (r) =>
        r
          ? [
              ...r.data.map((v) => ({ type: 'Vaccination' as const, id: v.id })),
              { type: 'Vaccination' as const, id: 'LIST' },
            ]
          : [{ type: 'Vaccination' as const, id: 'LIST' }],
    }),
    createVaccination: build.mutation<Vaccination, Partial<Vaccination>>({
      query: (body) => ({ url: 'medical/vaccinations', method: 'POST', body }),
      transformResponse: unwrap<Vaccination>(),
      invalidatesTags: [{ type: 'Vaccination', id: 'LIST' }],
    }),
    updateVaccination: build.mutation<Vaccination, { id: string; patch: Partial<Vaccination> }>({
      query: ({ id, patch }) => ({
        url: `medical/vaccinations/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: unwrap<Vaccination>(),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Vaccination', id },
        { type: 'Vaccination', id: 'LIST' },
      ],
    }),
    deleteVaccination: build.mutation<void, string>({
      query: (id) => ({ url: `medical/vaccinations/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Vaccination', id },
        { type: 'Vaccination', id: 'LIST' },
      ],
    }),

    // ─── Body region findings ────────────────────────────────────────────────
    listBodyRegions: build.query<Paged<BodyRegionFinding>, PageQuery | void>({
      query: (params) => ({
        url: 'medical/body-regions',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: unwrap<Paged<BodyRegionFinding>>(),
      providesTags: (r) =>
        r
          ? [
              ...r.data.map((b) => ({ type: 'BodyRegion' as const, id: b.id })),
              { type: 'BodyRegion' as const, id: 'LIST' },
            ]
          : [{ type: 'BodyRegion' as const, id: 'LIST' }],
    }),
    createBodyRegion: build.mutation<BodyRegionFinding, Partial<BodyRegionFinding>>({
      query: (body) => ({ url: 'medical/body-regions', method: 'POST', body }),
      transformResponse: unwrap<BodyRegionFinding>(),
      invalidatesTags: [{ type: 'BodyRegion', id: 'LIST' }],
    }),
    updateBodyRegion: build.mutation<
      BodyRegionFinding,
      { id: string; patch: Partial<BodyRegionFinding> }
    >({
      query: ({ id, patch }) => ({
        url: `medical/body-regions/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: unwrap<BodyRegionFinding>(),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'BodyRegion', id },
        { type: 'BodyRegion', id: 'LIST' },
      ],
    }),
    deleteBodyRegion: build.mutation<void, string>({
      query: (id) => ({ url: `medical/body-regions/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'BodyRegion', id },
        { type: 'BodyRegion', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListVitalsQuery,
  useCreateVitalMutation,
  useUpdateVitalMutation,
  useDeleteVitalMutation,
  useListProblemsQuery,
  useCreateProblemMutation,
  useUpdateProblemMutation,
  useDeleteProblemMutation,
  useListVaccinationsQuery,
  useCreateVaccinationMutation,
  useUpdateVaccinationMutation,
  useDeleteVaccinationMutation,
  useListBodyRegionsQuery,
  useCreateBodyRegionMutation,
  useUpdateBodyRegionMutation,
  useDeleteBodyRegionMutation,
} = medicalApi;
