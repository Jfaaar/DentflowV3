import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { Sidebar } from '../components/layout/Sidebar';
import { Layout } from '../components/layout/Layout';
import { Topbar } from '../components/layout/Topbar';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { AuthProvider, useAuth } from '../features/auth/useAuth';
import { LanguageProvider } from '../features/language/LanguageContext';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { PatientsPage } from '../features/patients/PatientsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { TeamPage } from '../features/settings/TeamPage';

// Phase 3 clinical pages
import { ClinicalNoteEditor } from '../features/clinical/ClinicalNoteEditor';
import { DentalChart } from '../features/clinical/DentalChart';
import { TreatmentPlanPage } from '../features/treatments/TreatmentPlanPage';
import { InsuranceTab } from '../features/insurance/InsuranceTab';
import { PrescriptionEditor } from '../features/prescriptions/PrescriptionEditor';
import { RequirePermission } from '../features/auth/RouteGuards';
import { useParams } from 'react-router-dom';

import { BackofficeSidebar } from '../features/backoffice/BackofficeSidebar';
import { ClinicsPage } from '../features/backoffice/ClinicsPage';
import { ClinicDetailsPage } from '../features/backoffice/ClinicDetailsPage';
import { DashboardPage as BackofficeDashboardPage } from '../features/backoffice/DashboardPage';

import { RequireAuth, RequireRole, RoleLanding } from '../features/auth/RouteGuards';

// ─── Clinic shell (doctor / assistant / clinic_admin) ────────────────────────

const APP_TAB_TO_PATH: Record<string, string> = {
  dashboard: '/app/dashboard',
  calendar: '/app/calendar',
  patients: '/app/patients',
  invoices: '/app/invoices',
  inventory: '/app/inventory',
  team: '/app/team',
  settings: '/app/settings',
};

const ClinicShell: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab =
    Object.entries(APP_TAB_TO_PATH).find(([, p]) => location.pathname.startsWith(p))?.[0] ??
    'dashboard';

  const handleNavigate = (tab: string) => {
    const target = APP_TAB_TO_PATH[tab];
    if (target) navigate(target);
  };

  return (
    <Layout
      sidebar={<Sidebar activeTab={activeTab} onNavigate={handleNavigate} onLogout={logout} />}
    >
      <Outlet />
    </Layout>
  );
};

// Patient-scoped wrapper: pulls :patientId from the URL and passes it to a
// page component. `onBack` returns to the patient list.
const PatientScopedRoute: React.FC<{
  Component: React.FC<{ patientId: string; patientName?: string; onBack: () => void }>;
}> = ({ Component }) => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  if (!patientId) return <Navigate to="/app/patients" replace />;
  return <Component patientId={patientId} onBack={() => navigate('/app/patients')} />;
};

const SettingsPlaceholder: React.FC = () => (
  <>
    <Topbar title="Settings" />
    <div className="flex flex-col items-center justify-center h-full text-surface-400 dark:text-surface-500">
      <div className="bg-surface-100 dark:bg-surface-800 p-6 rounded-full mb-4">
        <span className="text-4xl grayscale opacity-50">🚧</span>
      </div>
      <h3 className="text-xl font-medium text-surface-900 dark:text-white">
        Feature Under Construction
      </h3>
      <p className="max-w-xs text-center mt-2 text-surface-500 dark:text-surface-400">
        The settings module is currently being developed.
      </p>
    </div>
  </>
);

// ─── Backoffice shell (super_admin) ──────────────────────────────────────────

const BACKOFFICE_TAB_TO_PATH: Record<string, string> = {
  dashboard: '/backoffice',
  clinics: '/backoffice/clinics',
};

const BackofficeShell: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab =
    location.pathname.startsWith('/backoffice/clinics') ? 'clinics' : 'dashboard';

  const handleNavigate = (tab: string) => {
    const target = BACKOFFICE_TAB_TO_PATH[tab] ?? '/backoffice';
    navigate(target);
  };

  return (
    <Layout
      sidebar={
        <BackofficeSidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      }
    >
      <Outlet />
    </Layout>
  );
};

const ClinicDetailsRoute: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clinicId = location.pathname.split('/').pop() || '';
  return <ClinicDetailsPage clinicId={clinicId} onBack={() => navigate('/backoffice/clinics')} />;
};

// ─── Auth pages with router-aware navigation ─────────────────────────────────

const LoginRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoginPage onRegisterClick={() => navigate('/register')} />;
};

const RegisterRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <RegisterPage onBackToLogin={() => navigate('/login')} />;
};

// ─── Routes ──────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<RoleLanding />} />
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/register" element={<RegisterRoute />} />

    <Route element={<RequireAuth />}>
      {/* Clinic users */}
      <Route
        element={<RequireRole roles={['clinic_admin', 'doctor', 'assistant']} fallback="/backoffice" />}
      >
        <Route path="/app" element={<ClinicShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:patientId" element={<PatientsPage />} />
          <Route element={<RequirePermission permission="clinical.view" />}>
            <Route
              path="patients/:patientId/clinical"
              element={<PatientScopedRoute Component={ClinicalNoteEditor} />}
            />
          </Route>
          <Route element={<RequirePermission permission="dentalChart.view" />}>
            <Route
              path="patients/:patientId/dental-chart"
              element={<PatientScopedRoute Component={DentalChart} />}
            />
          </Route>
          <Route element={<RequirePermission permission="insurance.view" />}>
            <Route
              path="patients/:patientId/insurance"
              element={<PatientScopedRoute Component={InsuranceTab} />}
            />
          </Route>
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route element={<RequirePermission permission="treatments.view" />}>
            <Route path="treatments" element={<TreatmentPlanPage />} />
          </Route>
          <Route element={<RequirePermission permission="prescriptions.view" />}>
            <Route path="prescriptions" element={<PrescriptionEditor />} />
          </Route>
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPlaceholder />} />
        </Route>
      </Route>

      {/* Super admin */}
      <Route element={<RequireRole roles={['super_admin']} fallback="/app/dashboard" />}>
        <Route path="/backoffice" element={<BackofficeShell />}>
          <Route index element={<BackofficeDashboardPage />} />
          <Route path="clinics" element={<ClinicsPage />} />
          <Route path="clinics/:clinicId" element={<ClinicDetailsRoute />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <ThemeProvider>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
