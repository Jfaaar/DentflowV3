# Architecture Brief — Redesign target to match the bewize-ERP reference project

Use this document as the spec when refactoring this project to match the architecture of the reference codebase (bewize-ERP frontend). Treat it as a hard contract: structure, naming, and conventions should match.

## Stack

- **Build**: Vite + React 18 + TypeScript (strict)
- **Routing**: react-router-dom v6
- **State**: Redux Toolkit + react-redux; **server state via RTK Query** (single shared `baseApi` + `injectEndpoints`)
- **Forms**: react-hook-form + zod (`@hookform/resolvers`)
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives) + `lucide-react` + `class-variance-authority` + `tailwind-merge` + `clsx` + `tailwindcss-animate` + `next-themes` + `sonner` (toasts)
- **i18n**: i18next + react-i18next
- **Dates**: date-fns
- **DnD** (where needed): `@dnd-kit/*`
- **Tests**: Vitest + Testing Library + jsdom + Playwright (e2e) + MSW (API mocks)
- **Package manager**: Yarn (Berry / PnP-compatible)

## Directory layout (under `src/`)

```
src/
  app/                  # App.tsx (router), main.tsx (bootstrap), top-level providers
  components/
    ui/                 # shadcn primitives (button, dialog, input, …)
    atoms/              # smallest design-system pieces
    molecules/          # composed UI bits
    organisms/          # bigger composed UI sections
    templates/          # page-level layouts
  features/             # ⭐ feature-sliced — one folder per business domain
    <feature>/
      api/              # RTK Query slices (baseApi.injectEndpoints)
      components/       # feature pages + components (PascalCase .tsx)
      hooks/            # feature-specific hooks (useXxx.ts)
      store/            # optional Redux slice (only if local state needed)
      types/            # *.types.ts (DTOs, request/response, enums)
      utils/            # pure helpers
      index.ts          # PUBLIC barrel — only export what other features may use
  services/
    api/
      baseApi.ts        # createApi w/ fetchBaseQuery, auth header, tagTypes
      error.ts          # error normalization
      index.ts
  shared/               # cross-feature reusable code (NOT app-specific)
    api/                # shared API helpers
    components/         # shared cross-cutting components
    constants/          # routes.ts, branding.ts, …
    hooks/              # useDebounce, useToast, useApiError, useAsync, …
    i18n/               # i18next config + locales
    storage/            # localStorage wrappers (e.g., authStorage)
    types/              # shared TS types
    utils/              # cn, date, formatDate, handleApiError, hexToHsl, …
  store/
    index.ts            # configureStore — registers feature slices + baseApi
    hooks.ts            # typed useAppDispatch / useAppSelector
  mocks/                # MSW handlers for dev/tests
  design-tokens.css
  index.css
  vite-env.d.ts
```

Plus at repo root: `tests/`, `e2e/`, `public/`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `playwright.config.ts`, `.eslintrc.js`, `components.json` (shadcn), `Dockerfile`, `nginx.conf`.

## Path aliases (Vite + tsconfig must match)

```
@/*            -> src/*
@/app/*        -> src/app/*
@/components/* -> src/components/*
@/features/*   -> src/features/*
@/shared/*     -> src/shared/*
@/services/*   -> src/services/*
@/assets/*     -> src/assets/*
```

## Core conventions

1. **Feature-sliced**, not type-sliced. Each domain owns its api/components/hooks/types/utils and (optionally) a Redux slice. Cross-feature consumption goes **through `features/<x>/index.ts` barrels only** — never deep-import another feature's internals.
2. **One shared `baseApi`** in `services/api/baseApi.ts`:
   - `createApi({ reducerPath: 'api', baseQuery: fetchBaseQuery({ baseUrl, prepareHeaders }) })`
   - `prepareHeaders` reads token from `shared/storage/authStorage` and sets `Authorization: Bearer …`; skips `Content-Type` for multipart endpoints.
   - Centralized `tagTypes` array (User, Auth, AcademicYear, Role, …).
   - Each feature does `baseApi.injectEndpoints({ endpoints: build => ({ … }) })` and exports the auto-generated `useXxxQuery`/`useXxxMutation` hooks.
   - `providesTags` / `invalidatesTags` patterns: `[{ type: 'X', id: 'LIST' }, { type: 'X', id }]`.
3. **Redux store** in `src/store/index.ts`:
   - Combines per-feature slices + `[baseApi.reducerPath]: baseApi.reducer`.
   - Middleware = default + custom logout middleware that calls `baseApi.util.resetApiState()` on logout + `baseApi.middleware`.
   - Eagerly imports feature API files (`import '@/features/x/api/xApi'`) so `injectEndpoints` runs at startup.
   - Exports `RootState`, `AppDispatch`. Typed hooks live in `store/hooks.ts`.
4. **Routing** in `src/app/App.tsx`:
   - Single Routes tree. Auth gating via `<ProtectedRoute>` / `RootRedirect`. Layouts via `<Outlet/>`-based shells (e.g., `AuthenticatedLayout`).
   - Route constants in `shared/constants/routes.ts`.
5. **Components**:
   - `components/ui/` = shadcn primitives (do not edit ad-hoc; configured via `components.json`).
   - Atomic design layers (`atoms`/`molecules`/`organisms`/`templates`) for reusable design-system pieces.
   - Page-like components live in the relevant `features/<x>/components/`.
6. **Forms**: react-hook-form + zod resolver; one zod schema per form; submit handlers call RTK Query mutations and surface errors via `shared/utils/handleApiError` + `sonner` toasts (`shared/hooks/useToast`).
7. **Naming**: `PascalCase.tsx` for components, `useThing.ts` for hooks, `thing.types.ts` for types, `thingApi.ts` for RTK Query slices, `thingSlice.ts` for Redux slices.
8. **Strict TS** (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`). No `any`. DTOs typed in `types/`.
9. **Env**: `VITE_API_BASE_URL` (default `/api/v1`); Vite dev proxy forwards `/api/v1` to backend. Don't hardcode URLs.
10. **Testing**: unit/integration with Vitest + RTL co-located as `*.test.ts(x)`; MSW for network; Playwright e2e in `e2e/`. Coverage thresholds ~80%.
11. **i18n**: all user-facing strings via `useTranslation()`; locales under `shared/i18n/`.

## Reference snippets

### `services/api/baseApi.ts`

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getStoredToken } from '@/shared/storage/authStorage';

function getBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base?.trim()) return base.trim().replace(/\/$/, '');
  return '/api/v1';
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders(headers, { endpoint }) {
      const token = getStoredToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      // skip Content-Type for multipart endpoints
      if (typeof endpoint === 'string' && endpoint.includes('upload')) return headers;
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Auth', /* …add domain tags here */],
  endpoints: () => ({}),
});
```

### Feature API slice (pattern)

```ts
// features/patients/api/patientsApi.ts
import { baseApi } from '@/services/api/baseApi';
import type { Patient, PatientsPageResponse, PatientsSearchParams } from '../types/patient.types';

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchPatients: build.query<PatientsPageResponse, PatientsSearchParams>({
      query: ({ q = '', page = 0, size = 20 }) => ({
        url: 'patients/search',
        params: { q: q || undefined, page, size },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({ type: 'Patient' as const, id: p.id })),
              { type: 'Patient', id: 'LIST' },
            ]
          : [{ type: 'Patient', id: 'LIST' }],
    }),
  }),
});

export const { useSearchPatientsQuery } = patientsApi;
```

### `store/index.ts`

```ts
import type { Middleware } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer, logout } from '@/features/auth/store/authSlice';
import { baseApi } from '@/services/api/baseApi';

// Eagerly register RTK Query endpoints
import '@/features/patients/api/patientsApi';
// import '@/features/<other>/api/<other>Api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (gdm) =>
    gdm().concat(
      ((api) => (next) => (action) => {
        if (action?.type === logout.type) api.dispatch(baseApi.util.resetApiState());
        return next(action);
      }) as Middleware,
      baseApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Feature barrel (`features/<x>/index.ts`)

```ts
export { PatientsDashboardPage } from './components/PatientsDashboardPage';
export { PatientDetailPage } from './components/PatientDetailPage';
export { usePatientSearch } from './hooks/usePatientSearch';
export { useSearchPatientsQuery } from './api/patientsApi';
export type { Patient, PatientsSearchParams } from './types/patient.types';
```

## Migration plan for this project

1. Create the directory skeleton above; add path aliases to `vite.config.ts` and `tsconfig.json`.
2. Install the dep set listed under **Stack** (use the reference project's versions when in doubt).
3. Add `services/api/baseApi.ts` with `createApi` + `tagTypes` + auth header.
4. Create `store/index.ts` with `configureStore`, `baseApi` reducer + middleware, logout-resets-cache middleware, and typed hooks in `store/hooks.ts`.
5. Move existing screens into `features/<domain>/{api,components,hooks,store?,types,utils,index.ts}` slices; rewrite each data layer as `baseApi.injectEndpoints` and re-export the generated hooks from `index.ts`.
6. Lift cross-cutting code (debounce, toast, formatDate, cn, error handling, auth storage, route constants, i18n setup) into `shared/`.
7. Move shadcn primitives under `components/ui/` and configure `components.json`; introduce `atoms/molecules/organisms/templates` only as needed.
8. Centralize routing in `app/App.tsx`; add `ProtectedRoute` + role/permission gating; route constants in `shared/constants/routes.ts`.
9. Add Vitest config, MSW handlers in `src/mocks/`, Playwright config + `e2e/` folder.
10. Replace deep cross-feature imports with imports through each feature's `index.ts` barrel.

## Hard rules

- One shared `baseApi`. No second `createApi` call anywhere.
- No deep imports between features — only through `features/<x>/index.ts` barrels.
- Forms validated with zod schemas at the form boundary; RHF for state.
- No API URLs outside `baseApi`. Use `VITE_API_BASE_URL` + dev proxy.
- Logout must call `baseApi.util.resetApiState()` (handled by store middleware).
- Strict TS, no `any`, DTOs in `types/`.
- All user-facing strings go through i18n.
