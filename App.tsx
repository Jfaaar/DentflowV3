
import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { AuthProvider, useAuth } from './features/auth/useAuth';
import { LanguageProvider } from './features/language/LanguageContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import { CalendarPage } from './features/calendar/CalendarPage';
import { PatientsPage } from './features/patients/PatientsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { TeamPage } from './features/settings/TeamPage';
import { Topbar } from './components/layout/Topbar';

import { RegisterPage } from './features/auth/RegisterPage';

// Main Application Content (Protected)
const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'patients':
        return <PatientsPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'team':
        return <TeamPage />;
      case 'settings':
        return (
          <>
            <Topbar title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
            <div className="flex flex-col items-center justify-center h-full text-surface-400 dark:text-surface-500">
              <div className="bg-surface-100 dark:bg-surface-800 p-6 rounded-full mb-4">
                <span className="text-4xl grayscale opacity-50">🚧</span>
              </div>
              <h3 className="text-xl font-medium text-surface-900 dark:text-white">Feature Under Construction</h3>
              <p className="max-w-xs text-center mt-2 text-surface-500 dark:text-surface-400">
                The {activeTab} module is currently being developed.
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      sidebar={<Sidebar activeTab={activeTab} onNavigate={setActiveTab} onLogout={logout} />}
    >
      {renderContent()}
    </Layout>
  );
};

// Root App Component with Providers
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}




import { BackofficeSidebar } from './features/backoffice/BackofficeSidebar';
import { ClinicsPage } from './features/backoffice/ClinicsPage';
import { ClinicDetailsPage } from './features/backoffice/ClinicDetailsPage';
import { DashboardPage as BackofficeDashboardPage } from './features/backoffice/DashboardPage';

const Backoffice: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const renderContent = () => {
    if (selectedClinicId) {
      return <ClinicDetailsPage clinicId={selectedClinicId} onBack={() => setSelectedClinicId(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <BackofficeDashboardPage />;
      case 'clinics':
        return <ClinicsPage />;
      default:
        return <BackofficeDashboardPage />;
    }
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setSelectedClinicId(null); // Reset detail view on tab switch
  };

  return (
    <Layout
      sidebar={<BackofficeSidebar activeTab={activeTab} onNavigate={handleNavigate} onLogout={logout} />}
    >
      {renderContent()}
    </Layout>
  );
};

// Separated to use hook context
const AuthConsumer = () => {
  const { isAuthenticated, user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (isAuthenticated) {
    if (user?.role === 'super_admin') {
      return <Backoffice />;
    }
    return <Dashboard />;
  }

  return isRegistering ? (
    <RegisterPage onBackToLogin={() => setIsRegistering(false)} />
  ) : (
    <LoginPage onRegisterClick={() => setIsRegistering(true)} />
  );
}

export default App;
