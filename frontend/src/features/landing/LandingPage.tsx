import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  HeartPulse,
  Languages,
  Lock,
  Menu,
  Moon,
  Package,
  Pill,
  PlayCircle,
  Quote,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage, type LanguageCode } from '../language/LanguageContext';
import { BRAND } from '../../lib/brand';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../shared/constants/routes';
import { Screenshot } from './Screenshot';
import { getLandingCopy } from './copy';

/** The landing page is public, so its copy comes from ./copy rather than t(). */
const useCopy = () => getLandingCopy(useLanguage().language);

// ─── Hooks ───────────────────────────────────────────────────────────────────

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return reduced;
};

const useScrolled = (threshold = 8): boolean => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
};

const useScrollSpy = (ids: readonly string[], offset = 120): string | null => {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + offset;
      let found: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) found = id;
      }
      setActive(found);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids, offset]);
  return active;
};

interface RevealReturn<T extends HTMLElement> {
  ref: React.MutableRefObject<T | null>;
  shown: boolean;
}
const useReveal = <T extends HTMLElement>(): RevealReturn<T> => {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return { ref, shown };
};

const useOnClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void,
) => {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [ref, handler]);
};

// ─── Tiny reusable atoms ─────────────────────────────────────────────────────

const Reveal: React.FC<{
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'span';
  children: React.ReactNode;
}> = ({ delay = 0, className, as: Tag = 'div', children }) => {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  );
};

const Counter: React.FC<{
  end: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}> = ({ end, decimals = 0, suffix = '', prefix = '', duration = 1400 }) => {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? end : 0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced) {
      setValue(end);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const startTs = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - startTs) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(end * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration, reduced]);
  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ─── Browser frame ───────────────────────────────────────────────────────────

interface BrowserFrameProps {
  children: React.ReactNode;
  url?: string;
  className?: string;
  ratio?: 'wide' | 'square';
}

const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  url = 'app.medineeo.com',
  className,
  ratio = 'wide',
}) => (
  <div
    className={cn(
      'relative rounded-2xl overflow-hidden border border-surface-200/80 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-elevated',
      className,
    )}
  >
    <div className="flex items-center gap-1.5 px-4 h-9 bg-surface-100 dark:bg-surface-800/80 border-b border-surface-200 dark:border-surface-700/60">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
      <span className="ms-3 px-3 py-0.5 rounded-md text-[11px] text-surface-500 dark:text-surface-400 bg-white/70 dark:bg-surface-700/40 border border-surface-200/70 dark:border-surface-700/60 truncate font-mono">
        {url}
      </span>
    </div>
    <div className={cn(ratio === 'wide' ? 'aspect-[16/10]' : 'aspect-[4/3]', 'overflow-hidden')}>
      {children}
    </div>
  </div>
);

// ─── Top nav ─────────────────────────────────────────────────────────────────

const NAV_IDS = ['product', 'workflow', 'security', 'pricing', 'faq'] as const;

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ar', label: 'العربية', short: 'AR' },
];

const LangSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));
  const current =
    LANGUAGE_OPTIONS.find((o) => o.code === language) ?? LANGUAGE_OPTIONS[0];
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Languages size={16} aria-hidden />
        <span className="hidden sm:inline">{current.short}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-40 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-elevated overflow-hidden z-50"
        >
          {LANGUAGE_OPTIONS.map((o) => (
            <button
              key={o.code}
              onClick={() => {
                setLanguage(o.code);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-start hover:bg-surface-50 dark:hover:bg-surface-800',
                o.code === language
                  ? 'text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-surface-700 dark:text-surface-200',
              )}
            >
              <span>{o.label}</span>
              {o.code === language && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const copy = useCopy();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? copy.a11y.switchToLight : copy.a11y.switchToDark}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

const TopNav: React.FC = () => {
  const copy = useCopy();
  const ids = useMemo(() => [...NAV_IDS], []);
  const active = useScrollSpy(ids);
  const scrolled = useScrolled(8);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on resize / route change
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'backdrop-blur-md bg-white/80 dark:bg-surface-950/80 border-b border-surface-200/60 dark:border-surface-800/60 shadow-soft'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center" aria-label={copy.a11y.home}>
          <Logo size="md" />
        </a>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {NAV_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                'px-3 py-2 rounded-lg transition-colors',
                active === id
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50/80 dark:bg-primary-900/30'
                  : 'text-surface-600 dark:text-surface-300 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-surface-100/70 dark:hover:bg-surface-800/60',
              )}
            >
              {copy.nav[id]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1">
            <LangSwitcher />
            <ThemeToggle />
          </div>
          <Link to={ROUTES.auth.login} className="hidden sm:block">
            <Button variant="ghost" size="md">
              {copy.actions.signIn}
            </Button>
          </Link>
          <Link to={ROUTES.auth.register} className="hidden sm:block">
            <Button variant="gradient" size="md">
              {copy.actions.startFreeTrial}
            </Button>
          </Link>
          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-label={copy.a11y.toggleMenu}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
          mobileOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-6 pb-6 pt-2 space-y-1 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
          {NAV_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-3 py-2.5 rounded-lg text-base font-medium',
                active === id
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30'
                  : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800',
              )}
            >
              {copy.nav[id]}
            </a>
          ))}
          <div className="pt-3 mt-2 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <LangSwitcher />
              <ThemeToggle />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link to={ROUTES.auth.login} onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="md" className="w-full">
                {copy.actions.signIn}
              </Button>
            </Link>
            <Link to={ROUTES.auth.register} onClick={() => setMobileOpen(false)}>
              <Button variant="gradient" size="md" className="w-full">
                {copy.actions.startFree}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Hero ────────────────────────────────────────────────────────────────────

const useTilt = (max = 6) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(1200px) rotateX(${(-y * max).toFixed(
          2,
        )}deg) rotateY(${(x * max).toFixed(2)}deg)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced, max]);
  return ref;
};

// Numbers only — the labels are translated, see copy.hero.stats.
const HERO_STATS: Array<{
  end?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  text?: string;
}> = [
  { end: 16, suffix: '+' },
  { end: 5 },
  { end: 99.9, decimals: 1, suffix: '%' },
  { text: 'HIPAA' },
];

const Hero: React.FC = () => {
  const tiltRef = useTilt(5);
  const copy = useCopy();
  return (
    <section id="top" className="relative overflow-hidden pt-8">
      <span
        aria-hidden
        className="absolute -top-40 -end-40 w-[36rem] h-[36rem] rounded-full bg-primary-300/30 dark:bg-primary-500/20 blur-3xl animate-blob"
      />
      <span
        aria-hidden
        className="absolute top-1/3 -start-32 w-[28rem] h-[28rem] rounded-full bg-accent-300/30 dark:bg-accent-500/20 blur-3xl animate-blob"
        style={{ animationDelay: '8s' }}
      />
      <span aria-hidden className="absolute inset-0 bg-mesh-medical opacity-70 dark:opacity-40" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Copy column */}
          <div className="lg:col-span-6 animate-blur-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-surface-900/70 border border-primary-200/70 dark:border-primary-800/70 text-xs font-medium text-primary-700 dark:text-primary-300 backdrop-blur-sm">
              <Sparkles size={12} />
              {copy.hero.badge}
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-surface-900 dark:text-white leading-[1.05]">
              {copy.hero.titleTop}
              <span className="block gradient-text">{copy.hero.titleAccent}</span>
            </h1>
            <p className="mt-6 text-lg text-surface-600 dark:text-surface-300 leading-relaxed max-w-xl">
              {copy.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to={ROUTES.auth.register}>
                <Button variant="gradient" size="lg" className="w-full sm:w-auto group">
                  {copy.hero.ctaPrimary}
                  <ArrowRight
                    size={18}
                    className="ms-2 transition-transform group-hover:translate-x-0.5"
                  />
                </Button>
              </Link>
              <a href="#product">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <PlayCircle size={18} className="me-2" />
                  {copy.hero.ctaSecondary}
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-surface-500 dark:text-surface-400">
              {copy.hero.bullets.map((b) => (
                <span key={b} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent-600" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Product preview column */}
          <div className="lg:col-span-6 relative">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -inset-6 bg-gradient-to-tr from-primary-500/30 via-accent-400/20 to-transparent blur-2xl rounded-3xl"
              />
              <div
                ref={tiltRef}
                className="relative will-change-transform transition-transform duration-200 ease-out"
              >
                <BrowserFrame className="animate-blur-in">
                  <Screenshot
                    name="dashboard"
                    alt="MediNEEO dashboard — today’s revenue, appointments, agenda and cabinet alerts"
                    priority
                  />
                </BrowserFrame>
              </div>

              <div className="hidden md:flex absolute -bottom-8 -start-6 lg:-start-10 items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-elevated animate-float-slow">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow-accent">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-medium">
                    {copy.hero.todayLabel}
                  </div>
                  <div className="font-semibold text-surface-900 dark:text-white">
                    {copy.hero.todayValue}
                  </div>
                </div>
              </div>

              <div
                className="hidden md:flex absolute -top-6 -end-4 lg:-end-8 items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-elevated animate-float-slow"
                style={{ animationDelay: '2.5s' }}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
                  <Package size={20} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-medium">
                    {copy.hero.lowStockLabel}
                  </div>
                  <div className="font-semibold text-surface-900 dark:text-white">
                    {copy.hero.lowStockValue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <Reveal className="mt-24" delay={150}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {HERO_STATS.map((s, i) => (
              <div
                key={copy.hero.stats[i]}
                className="p-5 rounded-2xl bg-white/80 dark:bg-surface-900/60 border border-surface-200/70 dark:border-surface-800/70 backdrop-blur-sm shadow-soft text-center hover:shadow-elevated hover:-translate-y-0.5 transition-all"
              >
                <div className="font-display text-3xl font-bold gradient-text">
                  {s.text ?? (
                    <Counter
                      end={s.end ?? 0}
                      decimals={s.decimals}
                      suffix={s.suffix}
                      prefix={s.prefix}
                    />
                  )}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-medium">
                  {copy.hero.stats[i]}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ─── Trusted-by strip (marquee) ──────────────────────────────────────────────

const TRUST_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Agadir',
  'Fès',
  'Meknès',
  'Oujda',
];

const TrustedBy: React.FC = () => {
  const copy = useCopy();
  return (
  <section className="relative py-12 border-y border-surface-200 dark:border-surface-800/60 bg-surface-50/60 dark:bg-surface-900/30">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col gap-5">
      <p className="text-sm font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider text-center">
        {copy.trustedBy}
      </p>
      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div className="marquee-track flex gap-12 w-max text-surface-400 dark:text-surface-500">
          {[...TRUST_CITIES, ...TRUST_CITIES].map((city, i) => (
            <span
              key={`${city}-${i}`}
              className="font-display text-lg font-semibold tracking-tight whitespace-nowrap"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
  );
};

// ─── Interactive product showcase ────────────────────────────────────────────

// Structure only — labels, titles, bodies and alt text are translated, see
// copy.showcase.tabs.
const SHOWCASE_TABS = [
  { id: 'dashboard', icon: Activity, url: 'app.medineeo.com/dashboard', shot: 'dashboard' },
  { id: 'patient', icon: Users, url: 'app.medineeo.com/patients/yasmine-alaoui', shot: 'patient-overview' },
  { id: 'calendar', icon: CalendarClock, url: 'app.medineeo.com/calendar', shot: 'calendar-month' },
  { id: 'inventory', icon: Package, url: 'app.medineeo.com/inventory', shot: 'stock' },
  { id: 'prescriptions', icon: Pill, url: 'app.medineeo.com/prescriptions', shot: 'prescription-modal' },
  { id: 'invoices', icon: ReceiptText, url: 'app.medineeo.com/invoices', shot: 'invoices' },
] as const;

const ProductShowcase: React.FC = () => {
  const copy = useCopy();
  const [active, setActive] = useState<(typeof SHOWCASE_TABS)[number]['id']>(
    'dashboard',
  );
  const current = SHOWCASE_TABS.find((t) => t.id === active) ?? SHOWCASE_TABS[0];
  const text = copy.showcase.tabs[current.id];
  return (
    <section id="product" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {copy.showcase.eyebrow}
            </span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
              {copy.showcase.title}
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              {copy.showcase.subtitle}
            </p>
          </div>
        </Reveal>

        {/* Tab strip */}
        <Reveal delay={100} className="mt-10">
          <div
            role="tablist"
            aria-label={copy.a11y.productModules}
            className="flex gap-1.5 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SHOWCASE_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-glow'
                      : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-200 hover:border-primary-300 dark:hover:border-primary-700',
                  )}
                >
                  <Icon size={15} />
                  {copy.showcase.tabs[t.id].label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active panel */}
        <Reveal delay={200} className="mt-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <h3 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
                {text.title}
              </h3>
              <p className="mt-3 text-surface-600 dark:text-surface-300 leading-relaxed">
                {text.body}
              </p>
              <ul className="mt-6 space-y-2.5">
                {copy.showcase.bullets.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-200">
                    <CheckCircle2
                      size={16}
                      className="text-accent-600 shrink-0 mt-0.5"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <div
                key={current.id}
                className="animate-blur-in"
              >
                <BrowserFrame url={current.url}>
                  <Screenshot name={current.shot} alt={text.alt} />
                </BrowserFrame>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ─── Workflow stepper (interactive) ──────────────────────────────────────────

// Structure only — titles, bodies and alt text are translated, see
// copy.workflow.steps.
const WORKFLOW = [
  { step: '01', key: 'book', shot: 'appointment-modal', color: 'from-primary-500 to-primary-700' },
  { step: '02', key: 'see', shot: 'patient-vitals', color: 'from-accent-500 to-accent-700' },
  { step: '03', key: 'prescribe', shot: 'prescription-modal', color: 'from-primary-500 to-accent-500' },
  { step: '04', key: 'bill', shot: 'patient-billing', color: 'from-amber-500 to-amber-600' },
] as const;

const Workflow: React.FC = () => {
  const copy = useCopy();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % WORKFLOW.length),
      4500,
    );
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  const current = WORKFLOW[active];
  const currentText = copy.workflow.steps[current.key];

  return (
    <section
      id="workflow"
      className="relative py-24 lg:py-32 bg-surface-50/80 dark:bg-surface-900/40 border-y border-surface-200/70 dark:border-surface-800/70 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {copy.workflow.eyebrow}
            </span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
              {copy.workflow.title}
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              {copy.workflow.subtitle}
            </p>
          </div>
        </Reveal>

        <div
          className="mt-12 grid lg:grid-cols-12 gap-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Step list */}
          <div className="lg:col-span-5 space-y-3">
            {WORKFLOW.map((w, i) => {
              const isActive = i === active;
              return (
                <button
                  key={w.step}
                  onClick={() => setActive(i)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'w-full text-start p-5 rounded-2xl border transition-all',
                    isActive
                      ? 'bg-white dark:bg-surface-900 border-primary-300 dark:border-primary-700 shadow-elevated'
                      : 'bg-white/60 dark:bg-surface-900/60 border-surface-200 dark:border-surface-800 hover:border-primary-200 dark:hover:border-primary-800',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br text-white font-display font-bold text-sm shrink-0 transition-shadow',
                        w.color,
                        isActive ? 'shadow-glow' : 'opacity-80',
                      )}
                    >
                      {w.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-lg font-semibold text-surface-900 dark:text-white">
                        {copy.workflow.steps[w.key].title}
                      </div>
                      <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
                        {copy.workflow.steps[w.key].body}
                      </p>
                      {/* Progress bar (only on active, when auto-advancing) */}
                      {isActive && !paused && !reduced && (
                        <div className="mt-3 h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                          <div
                            key={`${active}-${paused}`}
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                            style={{
                              animation: 'slideUp 4500ms linear forwards',
                              transformOrigin: 'left',
                              animationName: 'progressBar',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            <style>{`@keyframes progressBar { from { width: 0%; } to { width: 100%; } }`}</style>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-7">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -inset-4 bg-gradient-to-tr from-primary-500/15 to-accent-400/10 blur-2xl rounded-3xl"
              />
              <div key={current.step} className="relative animate-blur-in">
                <BrowserFrame url={`app.medineeo.com/${current.key}`}>
                  <Screenshot name={current.shot} alt={currentText.alt} />
                </BrowserFrame>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Feature grid ────────────────────────────────────────────────────────────

// Icons only — titles and bodies are translated, see copy.features.items.
const FEATURES = [Users, CalendarClock, ClipboardList, ReceiptText, Package, Pill] as const;

const FeatureGrid: React.FC = () => {
  const copy = useCopy();
  return (
  <section className="relative py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal>
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {copy.features.eyebrow}
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
            {copy.features.title}
          </h2>
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((Icon, i) => (
          <Reveal key={copy.features.items[i].title} delay={i * 60}>
            <div className="group h-full p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow group-hover:scale-105 transition-transform">
                <Icon size={20} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-surface-900 dark:text-white">
                {copy.features.items[i].title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {copy.features.items[i].body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
  );
};

// ─── Audience ────────────────────────────────────────────────────────────────

// Icons only — see copy.audience.items.
const AUDIENCE = [Stethoscope, HeartPulse, Users] as const;

const Audience: React.FC = () => {
  const copy = useCopy();
  return (
  <section className="relative py-24 lg:py-28 bg-surface-50/80 dark:bg-surface-900/40 border-y border-surface-200/70 dark:border-surface-800/70">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal>
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {copy.audience.eyebrow}
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
            {copy.audience.title}
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            {copy.audience.subtitle}
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
        {AUDIENCE.map((Icon, i) => (
          <Reveal key={copy.audience.items[i].title} delay={i * 80}>
            <div className="h-full p-7 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow-accent">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-surface-900 dark:text-white">
                {copy.audience.items[i].title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {copy.audience.items[i].body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
  );
};

// ─── Security ────────────────────────────────────────────────────────────────

// Icons only — see copy.security.items.
const TRUST = [Lock, ShieldCheck, FileText, Globe] as const;

const Security: React.FC = () => {
  const copy = useCopy();
  return (
  <section id="security" className="relative py-24 lg:py-28 scroll-mt-20">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12 items-center">
      <Reveal>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {copy.security.eyebrow}
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
            {copy.security.title}
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            {copy.security.body}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-800 text-sm font-medium text-accent-700 dark:text-accent-300">
            <Zap size={14} />
            {copy.security.badge}
          </div>
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-2 gap-4">
        {TRUST.map((Icon, i) => (
          <Reveal key={copy.security.items[i].title} delay={i * 80}>
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-0.5 transition-all">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-surface-900 dark:text-white">
                {copy.security.items[i].title}
              </h3>
              <p className="mt-1.5 text-sm text-surface-600 dark:text-surface-400">
                {copy.security.items[i].body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
  );
};

// ─── Testimonial carousel ────────────────────────────────────────────────────

// Testimonials are translated — see copy.testimonials.

const Testimonial: React.FC = () => {
  const copy = useCopy();
  const testimonials = copy.testimonials;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % testimonials.length),
      6500,
    );
    return () => window.clearInterval(id);
  }, [paused, reduced, testimonials.length]);
  const current = testimonials[idx];
  return (
    <section className="relative py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <Reveal>
          <div
            className="relative p-10 lg:p-14 rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <span
              aria-hidden
              className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-accent-400/30 blur-3xl"
            />
            <Quote size={32} className="text-accent-200 mb-4" aria-hidden />
            <div key={idx} className="animate-blur-in">
              <p className="font-display text-xl md:text-2xl leading-relaxed">
                &ldquo;{current.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center font-semibold">
                  {current.initials}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{current.name}</div>
                  <div className="text-white/70">{current.role}</div>
                </div>
              </div>
            </div>

            {/* Indicators */}
            <div className="relative mt-8 flex items-center gap-2">
              {testimonials.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setIdx(i)}
                  aria-label={`${copy.a11y.showTestimonial} ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === idx ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50',
                  )}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ─── Pricing (with monthly/annual toggle) ────────────────────────────────────

type Billing = 'monthly' | 'annual';



// Only the non-textual bits of a plan live here; names, blurbs, features and
// prices are translated — see copy.pricing.plans (same order).
const PLAN_META = [
  { href: ROUTES.auth.register, highlight: false },
  { href: ROUTES.auth.register, highlight: true },
  { href: ROUTES.auth.register, highlight: false },
] as const;

const Pricing: React.FC = () => {
  const copy = useCopy();
  const [billing, setBilling] = useState<Billing>('annual');
  return (
    <section
      id="pricing"
      className="relative py-24 lg:py-28 bg-surface-50/80 dark:bg-surface-900/40 border-y border-surface-200/70 dark:border-surface-800/70 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {copy.pricing.eyebrow}
            </span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
              {copy.pricing.title}
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              {copy.pricing.subtitle}
            </p>
          </div>
        </Reveal>

        {/* Billing toggle */}
        <Reveal delay={100}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div
              role="tablist"
              aria-label={copy.a11y.billingPeriod}
              className="inline-flex p-1 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-soft"
            >
              {(['monthly', 'annual'] as const).map((b) => {
                const isActive = billing === b;
                return (
                  <button
                    key={b}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setBilling(b)}
                    className={cn(
                      'relative px-5 h-10 rounded-xl text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-glow'
                        : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white',
                    )}
                  >
                    {b === 'monthly' ? copy.pricing.monthly : copy.pricing.annual}
                    {b === 'annual' && (
                      <span
                        className={cn(
                          'ms-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300',
                        )}
                      >
                        −20%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLAN_META.map((meta, i) => {
            const p = copy.pricing.plans[i];
            const price = billing === 'annual' ? p.annualPrice : p.monthlyPrice;
            return (
              <Reveal key={p.name} delay={i * 80}>
                <div
                  className={cn(
                    'relative h-full p-7 rounded-3xl bg-white dark:bg-surface-900 transition-all',
                    meta.highlight
                      ? 'border-2 border-primary-500 shadow-elevated lg:-translate-y-2'
                      : 'border border-surface-200 dark:border-surface-800 shadow-soft hover:shadow-elevated hover:-translate-y-0.5',
                  )}
                >
                  {meta.highlight && (
                    <span className="absolute -top-3 start-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white text-xs font-semibold shadow-glow">
                      <Sparkles size={12} />
                      {copy.pricing.mostPopular}
                    </span>
                  )}
                  <div className="font-display text-xl font-semibold text-surface-900 dark:text-white">
                    {p.name}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2 min-h-[3.5rem]">
                    <span className="font-display text-4xl font-bold text-surface-900 dark:text-white">
                      {price.value}
                    </span>
                    <span className="text-sm text-surface-500 dark:text-surface-400">
                      {price.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                    {p.blurb}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300"
                      >
                        <CheckCircle2 size={16} className="text-accent-600 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={meta.href} className="block mt-7">
                    <Button
                      variant={meta.highlight ? 'gradient' : 'outline'}
                      size="lg"
                      className="w-full"
                    >
                      {p.cta}
                    </Button>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────

// FAQ entries are translated — see copy.faq.items.

const FaqItem: React.FC<{ q: string; a: string; defaultOpen?: boolean }> = ({
  q,
  a,
  defaultOpen,
}) => {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();
  return (
    <div className="rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors"
      >
        <span className="font-display text-base md:text-lg font-semibold text-surface-900 dark:text-white">
          {q}
        </span>
        <ChevronDown
          size={20}
          className={cn(
            'shrink-0 text-surface-500 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        id={id}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
};

const Faq: React.FC = () => {
  const copy = useCopy();
  return (
  <section id="faq" className="relative py-24 lg:py-28 scroll-mt-20">
    <div className="max-w-4xl mx-auto px-6 lg:px-10">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {copy.faq.eyebrow}
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
            {copy.faq.title}
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            {copy.faq.subtitleBefore}{' '}
            <a
              href="mailto:hello@medineeo.com"
              className="text-primary-600 dark:text-primary-300 font-medium hover:underline"
            >
              hello@medineeo.com
            </a>
            {copy.faq.subtitleAfter}
          </p>
        </div>
      </Reveal>
      <div className="mt-12 space-y-3">
        {copy.faq.items.map((f, i) => (
          <Reveal key={f.q} delay={i * 60}>
            <FaqItem q={f.q} a={f.a} defaultOpen={i === 0} />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
  );
};

// ─── Final CTA ───────────────────────────────────────────────────────────────

const FinalCta: React.FC = () => {
  const copy = useCopy();
  return (
  <section className="relative py-24 lg:py-28">
    <div className="max-w-5xl mx-auto px-6 lg:px-10">
      <Reveal>
        <div className="relative p-10 lg:p-16 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white text-center overflow-hidden">
          <span
            aria-hidden
            className="absolute -top-32 -end-32 w-96 h-96 rounded-full bg-accent-400/30 blur-3xl animate-blob"
          />
          <span
            aria-hidden
            className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full bg-primary-300/30 blur-3xl animate-blob"
            style={{ animationDelay: '6s' }}
          />
          <div className="relative">
            <Activity size={36} className="mx-auto text-accent-200" aria-hidden />
            <h2 className="mt-5 font-display text-3xl md:text-4xl font-bold tracking-tight">
              {copy.finalCta.title}
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              {copy.finalCta.body}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={ROUTES.auth.register}>
                <Button variant="accent" size="lg" className="w-full sm:w-auto group">
                  {copy.finalCta.primary}
                  <ArrowRight
                    size={18}
                    className="ms-2 transition-transform group-hover:translate-x-0.5"
                  />
                </Button>
              </Link>
              <Link to={ROUTES.auth.login}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto !border-white/30 !text-white hover:!bg-white/10"
                >
                  {copy.finalCta.secondary}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
  );
};

// ─── Footer ──────────────────────────────────────────────────────────────────

const Footer: React.FC = () => {
  const copy = useCopy();
  const productLinks = [
    { href: '#product', label: copy.footer.features },
    { href: '#workflow', label: copy.footer.workflow },
    { href: '#pricing', label: copy.footer.pricing },
    { href: '#security', label: copy.footer.security },
    { href: '#faq', label: copy.footer.faq },
  ];
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2">
          <Logo size="md" />
          <p className="mt-3 text-surface-500 dark:text-surface-400 max-w-xs">
            {copy.footer.tagline}
          </p>
        </div>
        <div>
          <div className="font-semibold text-surface-900 dark:text-white mb-3">
            {copy.footer.product}
          </div>
          <ul className="space-y-2 text-surface-500 dark:text-surface-400">
            {productLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-primary-700 dark:hover:text-primary-300">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold text-surface-900 dark:text-white mb-3">
            {copy.footer.account}
          </div>
          <ul className="space-y-2 text-surface-500 dark:text-surface-400">
            <li>
              <Link
                to={ROUTES.auth.login}
                className="hover:text-primary-700 dark:hover:text-primary-300"
              >
                {copy.actions.signIn}
              </Link>
            </li>
            <li>
              <Link
                to={ROUTES.auth.register}
                className="hover:text-primary-700 dark:hover:text-primary-300"
              >
                {copy.actions.createAccount}
              </Link>
            </li>
            <li>
              <a
                href="mailto:hello@medineeo.com"
                className="hover:text-primary-700 dark:hover:text-primary-300"
              >
                {copy.actions.contact}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-surface-200 dark:border-surface-800 py-5 text-xs text-surface-400 dark:text-surface-500 text-center">
        © {new Date().getFullYear()} {BRAND.NAME}. {copy.footer.rights}
      </div>
    </footer>
  );
};

// ─── Scroll-to-top ───────────────────────────────────────────────────────────

const ScrollTopButton: React.FC = () => {
  const copy = useCopy();
  const visible = useScrolled(640);
  const onClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return (
    <button
      onClick={onClick}
      aria-label={copy.a11y.backToTop}
      className={cn(
        'fixed bottom-6 end-6 z-40 inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-elevated hover:shadow-glow transition-all',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none',
      )}
    >
      <ArrowUp size={18} />
    </button>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const LandingPage: React.FC = () => {
  // Smooth-scroll behavior for in-page anchors (respects reduced motion).
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const original = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = reduced ? 'auto' : 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = original;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 antialiased">
      <TopNav />
      <main>
        <Hero />
        <TrustedBy />
        <ProductShowcase />
        <Workflow />
        <FeatureGrid />
        <Audience />
        <Security />
        <Testimonial />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <ScrollTopButton />
    </div>
  );
};
