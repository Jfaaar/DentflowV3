import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { Sidebar } from '../components/layout/Sidebar';
import { Layout } from '../components/layout/Layout';
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
import { SpecialtyPage } from '../features/settings/SpecialtyPage';

import { ClinicalNotesRoute } from '../features/clinical/ClinicalNotesRoute';
import { DentalChart } from '../features/clinical/DentalChart';
import { TreatmentPlanPage } from '../features/treatments/TreatmentPlanPage';
import { InsuranceTab } from '../features/insurance/InsuranceTab';
import { PrescriptionEditor } from '../features/prescriptions/PrescriptionEditor';

import { BackofficeSidebar } from '../features/backoffice/BackofficeSidebar';
import { ClinicsPage } from '../features/backoffice/ClinicsPage';
import { ClinicDetailsPage } from '../features/backoffice/ClinicDetailsPage';
import { DashboardPage as BackofficeDashboardPage } from '../features/backoffice/DashboardPage';

import { RoleLanding } from '../features/auth/RouteGuards';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import {
  ROUTES,
  APP_TAB_TO_PATH,
  BACKOFFICE_TAB_TO_PATH,
} from '../shared/constants/routes';

// ─── Clinic shell (doctor / assistant / clinic_admin) ────────────────────────

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

const PatientScopedRoute: React.FC<{
  Component: React.FC<{ patientId: string; patientName?: string; onBack?: () => void }>;
}> = ({ Component }) => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  if (!patientId) return <Navigate to={ROUTES.app.patients} replace />;
  return <Component patientId={patientId} onBack={() => navigate(ROUTES.app.patients)} />;
};

// ─── Backoffice shell (super_admin) ──────────────────────────────────────────

const BackofficeShell: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.startsWith(ROUTES.backoffice.clinics)
    ? 'clinics'
    : 'dashboard';

  const handleNavigate = (tab: string) => {
    const target = BACKOFFICE_TAB_TO_PATH[tab] ?? ROUTES.backoffice.base;
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
  return (
    <ClinicDetailsPage
      clinicId={clinicId}
      onBack={() => navigate(ROUTES.backoffice.clinics)}
    />
  );
};

// ─── Auth pages with router-aware navigation ─────────────────────────────────

const LoginRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to={ROUTES.root} replace />;
  return <LoginPage />;
};

const RegisterRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to={ROUTES.root} replace />;
  return <RegisterPage onBackToLogin={() => navigate(ROUTES.auth.login)} />;
};

// ─── Routes ──────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path={ROUTES.root} element={<RoleLanding />} />
    <Route path={ROUTES.auth.login} element={<LoginRoute />} />
    <Route path={ROUTES.auth.register} element={<RegisterRoute />} />

    {/* Clinic users */}
    <Route
      element={
        <ProtectedRoute
          roles={['clinic_admin', 'doctor', 'assistant']}
          forbiddenRedirect={ROUTES.backoffice.base}
        />
      }
    >
      <Route path={ROUTES.app.base} element={<ClinicShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:patientId" element={<PatientsPage />} />

        <Route element={<ProtectedRoute permission="clinical.view" />}>
          <Route
            path="patients/:patientId/clinical"
            element={<PatientScopedRoute Component={ClinicalNotesRoute} />}
          />
        </Route>
        <Route element={<ProtectedRoute permission="dentalChart.view" />}>
          <Route
            path="patients/:patientId/dental-chart"
            element={<PatientScopedRoute Component={DentalChart} />}
          />
        </Route>
        <Route element={<ProtectedRoute permission="insurance.view" />}>
          <Route
            path="patients/:patientId/insurance"
            element={<PatientScopedRoute Component={InsuranceTab} />}
          />
        </Route>

        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="inventory" element={<InventoryPage />} />

        <Route element={<ProtectedRoute permission="treatments.view" />}>
          <Route path="treatments" element={<TreatmentPlanPage />} />
        </Route>
        <Route element={<ProtectedRoute permission="prescriptions.view" />}>
          <Route path="prescriptions" element={<PrescriptionEditor />} />
        </Route>

        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SpecialtyPage />} />
        <Route path="settings/specialty" element={<SpecialtyPage />} />
      </Route>
    </Route>

    {/* Super admin */}
    <Route
      element={
        <ProtectedRoute
          roles={['super_admin']}
          forbiddenRedirect={ROUTES.app.dashboard}
        />
      }
    >
      <Route path={ROUTES.backoffice.base} element={<BackofficeShell />}>
        <Route index element={<BackofficeDashboardPage />} />
        <Route path="clinics" element={<ClinicsPage />} />
        <Route path="clinics/:clinicId" element={<ClinicDetailsRoute />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to={ROUTES.root} replace />} />
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
