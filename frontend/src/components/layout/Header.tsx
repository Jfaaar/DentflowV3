import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sun,
  UserRound,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../features/auth/useAuth';
import { useLanguage, type LanguageCode } from '../../features/language/LanguageContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { languages } from '../../lib/i18n/translations';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useMobileMenu } from './MobileMenuContext';

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  hideSearch?: boolean;
}

const useDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return { open, setOpen, ref };
};

const SearchTrigger: React.FC = () => {
  const { t } = useLanguage();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenModal(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className="hidden md:flex items-center gap-2 w-full max-w-md mx-auto h-9 px-3 rounded-xl bg-surface-100/70 dark:bg-surface-800/60 border border-surface-200/70 dark:border-surface-700/70 text-sm text-surface-500 dark:text-surface-400 hover:border-primary-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
      >
        <Search size={16} />
        <span className="flex-1 text-start truncate">{t('searchEverything')}</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-700 text-surface-500">
          ⌘K
        </kbd>
      </button>
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={t('search')}
        maxWidth="lg"
      >
        <div className="text-center py-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 flex items-center justify-center mb-4">
            <Search size={26} />
          </div>
          <p className="font-display text-lg font-semibold text-surface-900 dark:text-white">
            {t('searchComingSoon')}
          </p>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {t('searchEverything')}
          </p>
        </div>
      </Modal>
    </>
  );
};

const NotificationsBell: React.FC = () => {
  const { t } = useLanguage();
  const { open, setOpen, ref } = useDropdown();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t('notifications')}
        className="relative p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <Bell size={18} />
        <span className="absolute top-2 end-2 w-1.5 h-1.5 rounded-full bg-accent-500" aria-hidden />
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-80 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-elevated overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <span className="font-semibold text-surface-900 dark:text-white">
              {t('notifications')}
            </span>
            <Badge tone="vital" size="sm">
              new
            </Badge>
          </div>
          <div className="px-4 py-8 text-center text-sm text-surface-500 dark:text-surface-400">
            {t('noNotifications')}
          </div>
        </div>
      )}
    </div>
  );
};

const LanguageDropdown: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { open, setOpen, ref } = useDropdown();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t('changeLanguage' as any) || 'Language'}
        className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex items-center gap-1"
      >
        <Globe size={18} />
        <span className="hidden sm:inline text-xs uppercase font-medium">{language}</span>
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-44 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-elevated overflow-hidden z-50 animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code as LanguageCode);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-start hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                language === lang.code &&
                  'text-primary-600 dark:text-primary-400 font-semibold'
              )}
            >
              {lang.name}
              {language === lang.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const roleI18n = (
  role: string | undefined,
  t: ReturnType<typeof useLanguage>['t']
) => {
  switch (role) {
    case 'super_admin':
      return t('roleSuperAdmin');
    case 'clinic_admin':
      return t('roleClinicAdmin');
    case 'doctor':
      return t('roleDoctor');
    case 'assistant':
      return t('roleAssistant');
    default:
      return role || '';
  }
};

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { open, setOpen, ref } = useDropdown();

  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1 ps-1 pe-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold text-sm flex items-center justify-center shadow-glow">
          {initial}
        </span>
        <ChevronDown size={14} className="hidden md:block text-surface-500" />
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-64 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-elevated overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
            <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
              {user?.email}
            </p>
            {user?.role && (
              <Badge tone="primary" size="sm" dot className="mt-2">
                {roleI18n(user.role, t)}
              </Badge>
            )}
          </div>
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-start text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          >
            <UserRound size={16} className="text-surface-400" />
            {t('profile')}
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-start text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          >
            <SettingsIcon size={16} className="text-surface-400" />
            {t('settings')}
          </button>
          <div className="border-t border-surface-100 dark:border-surface-700" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ title, children, className, hideSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const { openMobileMenu } = useMobileMenu();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 backdrop-blur-xl bg-white/75 dark:bg-surface-900/75 border-b border-surface-200/60 dark:border-surface-800/60 transition-colors',
        className
      )}
    >
      <div className="px-4 md:px-8 h-16 flex items-center gap-3 md:gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={openMobileMenu}
          className="md:hidden p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Title */}
        <div className="min-w-0 flex-shrink-0">
          {title && (
            <h1 className="font-display text-lg md:text-xl font-bold text-surface-900 dark:text-white tracking-tight truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Search (center) */}
        {!hideSearch && (
          <div className="flex-1 px-2 md:px-6 flex justify-center">
            <SearchTrigger />
          </div>
        )}

        {/* Page action slot */}
        {children && (
          <div className="hidden md:flex items-center gap-2">{children}</div>
        )}

        {/* Right cluster */}
        <div className={cn('flex items-center gap-1', !hideSearch ? '' : 'ms-auto')}>
          <LanguageDropdown />
          <NotificationsBell />
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <UserMenu />
        </div>
      </div>

      {/* Mobile action slot */}
      {children && (
        <div className="md:hidden flex items-center gap-2 px-4 pb-3 -mt-1 overflow-x-auto">
          {children}
        </div>
      )}
    </header>
  );
};
