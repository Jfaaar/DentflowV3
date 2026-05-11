// Settings hub layout — renders a horizontal tab nav for the settings
// sub-pages (specialty, features, roles) and an <Outlet /> for the active
// page. Lives under /app/settings.
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stethoscope, ToggleLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabDef {
  to: string;
  labelKey: string;
  fallback: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { to: 'specialty', labelKey: 'settingsTabSpecialty', fallback: 'Specialty', icon: <Stethoscope size={16} /> },
  { to: 'features', labelKey: 'settingsTabFeatures', fallback: 'Features', icon: <ToggleLeft size={16} /> },
  { to: 'roles', labelKey: 'settingsTabRoles', fallback: 'Roles', icon: <ShieldCheck size={16} /> },
];

export const SettingsLayout: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full">
      <nav className="px-6 pt-6 border-b border-surface-100 dark:border-surface-800">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-primary-500 text-primary-700 dark:text-primary-200 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-white',
                )
              }
            >
              {tab.icon}
              {t(tab.labelKey, tab.fallback)}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};
