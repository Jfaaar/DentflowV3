// Centralized route constants. App.tsx and any navigation site that
// previously hardcoded '/app/...' or '/backoffice/...' should import from here.

export const ROUTES = {
  root: '/',
  auth: {
    login: '/login',
    register: '/register',
  },
  app: {
    base: '/app',
    dashboard: '/app/dashboard',
    calendar: '/app/calendar',
    patients: '/app/patients',
    patient: (id: string) => `/app/patients/${id}`,
    patientClinical: (id: string) => `/app/patients/${id}/clinical`,
    patientDentalChart: (id: string) => `/app/patients/${id}/dental-chart`,
    patientInsurance: (id: string) => `/app/patients/${id}/insurance`,
    invoices: '/app/invoices',
    inventory: '/app/inventory',
    treatments: '/app/treatments',
    prescriptions: '/app/prescriptions',
    team: '/app/team',
    settings: '/app/settings',
  },
  backoffice: {
    base: '/backoffice',
    clinics: '/backoffice/clinics',
    clinic: (id: string) => `/backoffice/clinics/${id}`,
  },
} as const;

// Sidebar tab → path lookup tables. Kept here so the Sidebar component
// and the active-tab detection in <ClinicShell> read from one source.
export const APP_TAB_TO_PATH: Record<string, string> = {
  dashboard: ROUTES.app.dashboard,
  calendar: ROUTES.app.calendar,
  patients: ROUTES.app.patients,
  invoices: ROUTES.app.invoices,
  inventory: ROUTES.app.inventory,
  team: ROUTES.app.team,
  settings: ROUTES.app.settings,
};

export const BACKOFFICE_TAB_TO_PATH: Record<string, string> = {
  dashboard: ROUTES.backoffice.base,
  clinics: ROUTES.backoffice.clinics,
};
