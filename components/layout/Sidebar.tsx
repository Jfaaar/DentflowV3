
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Settings, LogOut, Activity, LayoutDashboard, Languages, Check, ChevronUp, Moon, Sun, Receipt, ChevronLeft, ChevronRight, Package, Stethoscope, Pill } from 'lucide-react';
import { hasPermission } from '../../lib/permissions';
import { useAuth } from '../../features/auth/useAuth';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../features/language/LanguageContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { languages, LanguageCode } from '../../lib/i18n/translations';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  className?: string;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, onLogout, className, onMobileClose }) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const langMenuRef = useRef<HTMLDivElement>(null);

  const baseItems = [
    { id: 'dashboard', label: 'dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'calendar', icon: Calendar },
    { id: 'patients', label: 'patients', icon: Users },
    { id: 'invoices', label: 'invoices', icon: Receipt },
    { id: 'inventory', icon: Package, label: 'inventory' },
    // Phase 3 — Clinical
    ...(hasPermission(user?.role, 'treatments.view')
      ? [{ id: 'treatments', label: 'treatments', icon: Stethoscope }] : []),
    ...(hasPermission(user?.role, 'prescriptions.view')
      ? [{ id: 'prescriptions', label: 'prescriptions', icon: Pill }] : []),
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'settings', icon: Settings, label: 'settings' },
  ];
  const navItems = baseItems;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (id: string) => {
    onNavigate(id);
    if (onMobileClose) onMobileClose();
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // Close mobile menu if open when toggling (though usually this button is hidden on mobile)
    if (onMobileClose && window.innerWidth < 768) onMobileClose();
  };

  return (
    <aside
      className={cn(
        "bg-white dark:bg-surface-900 border-e border-surface-200 dark:border-surface-800 h-screen flex flex-col transition-all duration-300 ease-in-out relative z-30",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header / Logo */}
      <div className={cn(
        "flex items-center border-b border-surface-100 dark:border-surface-800 transition-all duration-300",
        isCollapsed ? "p-4 justify-center" : "p-6 gap-3"
      )}>
        <div className="bg-primary-600 p-2.5 rounded-xl text-white shrink-0 shadow-glow transition-transform duration-300 hover:scale-105">
          <Activity size={24} />
        </div>
        <div className={cn("overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          <h1 className="font-bold text-surface-900 dark:text-white text-lg leading-tight whitespace-nowrap">DentFlow</h1>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium whitespace-nowrap">{t('clinicManager')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              title={isCollapsed ? t(item.label as any) : ''}
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm"
                  : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white",
                isCollapsed ? "justify-center p-3" : "justify-start gap-3 px-4 py-3.5"
              )}
            >
              <Icon size={20} className={cn("transition-colors shrink-0", isActive ? "text-primary-600 dark:text-primary-400" : "text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300")} />

              <span className={cn(
                "whitespace-nowrap transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
              )}>
                {/* @ts-ignore */}
                {t(item.label)}
              </span>

              {isActive && isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-surface-100 dark:border-surface-800 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          className={cn(
            "w-full flex items-center rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors",
            isCollapsed ? "justify-center p-2.5" : "justify-between px-4 py-2.5"
          )}
        >
          <div className={cn("flex items-center", !isCollapsed && "gap-3")}>
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
        </button>

        {/* Language Selector */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            title="Change Language"
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-700",
              isCollapsed ? "justify-center p-2.5" : "justify-between px-4 py-2.5"
            )}
          >
            <div className={cn("flex items-center", !isCollapsed && "gap-3")}>
              <Languages size={20} className="text-surface-400" />
              <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                {languages.find(l => l.code === language)?.name}
              </span>
            </div>
            {!isCollapsed && (
              <ChevronUp size={16} className={cn("transition-transform shrink-0", isLangMenuOpen ? "rotate-180" : "")} />
            )}
          </button>

          {isLangMenuOpen && (
            <div className={cn(
              "absolute bottom-full w-48 mb-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl overflow-hidden animate-slide-up z-50",
              isCollapsed ? "start-full ms-2" : "start-0 w-full"
            )}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setIsLangMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-start hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <span className={cn("font-medium", language === lang.code ? "text-primary-600 dark:text-primary-400" : "text-surface-700 dark:text-surface-300")}>
                    {lang.name}
                  </span>
                  {language === lang.code && <Check size={16} className="text-primary-600 dark:text-primary-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          title={t('signOut')}
          className={cn(
            "w-full flex items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
            isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
          )}
        >
          <LogOut size={20} />
          <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            {t('signOut')}
          </span>
        </button>

        {/* Collapse Toggle (Desktop Only) */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex w-full items-center justify-center p-2 mt-2 text-surface-400 hover:text-primary-600 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};
