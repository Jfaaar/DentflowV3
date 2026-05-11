import React from 'react';
import { useLanguage, type LanguageCode } from '../language/LanguageContext';
import { Logo } from '../../components/ui/Logo';
import { Globe, Check, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BRAND } from '../../lib/brand';

const LANGS: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
];

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden uppercase">{current.code}</span>
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-44 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-elevated overflow-hidden z-20 animate-fade-in">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-start hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                language === l.code && 'text-primary-700 dark:text-primary-300 font-semibold'
              )}
            >
              {l.label}
              {language === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InvertedLogo: React.FC = () => (
  <div className="inline-flex items-center gap-3">
    <div
      className="inline-flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-glow"
      style={{ width: 44, height: 44 }}
      aria-hidden
    >
      <svg width={28} height={28} viewBox="0 0 32 32" fill="none">
        <path
          d="M14 6h4v8h8v4h-8v8h-4v-8H6v-4h8V6z"
          fill="white"
          opacity="0.18"
        />
        <path
          d="M3 16h5l2.5-5 3 10 3-7 2.5 4H29"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
    <span className="font-display font-bold tracking-tight text-2xl text-white">
      {BRAND.NAME}
    </span>
  </div>
);

const TrustChip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="inline-flex items-center gap-2 text-sm text-white/85">
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 border border-white/20">
      {icon}
    </span>
    {children}
  </div>
);

const BrandPanel: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
      {/* Decorative blobs */}
      <span
        aria-hidden
        className="absolute -top-32 -end-32 w-[28rem] h-[28rem] rounded-full bg-accent-400/30 blur-3xl animate-blob"
      />
      <span
        aria-hidden
        className="absolute bottom-1/4 -start-24 w-[24rem] h-[24rem] rounded-full bg-primary-300/30 blur-3xl animate-blob"
        style={{ animationDelay: '8s' }}
      />
      <span
        aria-hidden
        className="absolute top-1/2 start-1/3 w-[18rem] h-[18rem] rounded-full bg-accent-300/20 blur-3xl animate-blob"
        style={{ animationDelay: '16s' }}
      />

      {/* Pulse line decoration across the bottom */}
      <svg
        aria-hidden
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className="absolute bottom-24 inset-x-0 w-full h-16 opacity-25 text-white"
      >
        <path
          d="M0 40 L150 40 L180 18 L210 60 L240 8 L270 70 L300 40 L1200 40"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      {/* Subtle grid */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="medineeo-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#medineeo-grid)" />
      </svg>

      <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
        <InvertedLogo />

        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm mb-5">
            <Sparkles size={12} className="text-accent-200" />
            {t('clinicManager')}
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
            {t('brandTagline')}
          </h2>
          <p className="mt-5 text-base lg:text-lg text-white/80 leading-relaxed">
            {t('brandSubtagline')}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <TrustChip icon={<ShieldCheck size={14} />}>{t('trustEncrypted')}</TrustChip>
          <TrustChip icon={<Activity size={14} />}>{t('trustHIPAA')}</TrustChip>
          <TrustChip icon={<Sparkles size={14} />}>{t('trustClinics')}</TrustChip>
        </div>
      </div>
    </div>
  );
};

interface AuthShellProps {
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  const { dir, t } = useLanguage();

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-surface-950"
    >
      {/* Form column */}
      <div className="flex-1 flex flex-col bg-surface-50/50 dark:bg-surface-950">
        {/* Form slot — vertically centered, language switcher rides above the form,
            right-aligned with the form's max-w-md edge so it sits on the same axis
            as the page heading. */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-10 lg:px-14 py-6">
          <div className="w-full max-w-md animate-blur-in">
            <div className="flex items-center justify-between mb-6">
              <Logo size="md" className="md:hidden" />
              <span className="hidden md:block" />
              <LanguageSwitcher />
            </div>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-10 lg:px-14 py-5 text-xs text-surface-400 dark:text-surface-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {BRAND.NAME}</span>
          <span className="text-center">{t('authTrustFooter')}</span>
        </footer>
      </div>

      {/* Brand panel (desktop only) */}
      <BrandPanel />
    </div>
  );
};
