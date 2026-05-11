// Inline HTML mockups of the product UI for the marketing landing page.
// Used in place of real screenshots so the landing page works without binary
// assets, scales crisply at any resolution, and adapts to dark mode.

import React from 'react';
import {
  Activity,
  Bell,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileText,
  Globe,
  HeartPulse,
  Link as LinkIcon,
  Moon,
  Package,
  Pill as PillIcon,
  ReceiptText,
  Search,
  Stethoscope,
  Syringe,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Shared shell ────────────────────────────────────────────────────────────

const SidebarStrip: React.FC<{ active?: number }> = ({ active = 0 }) => {
  const icons = [
    Activity,
    CalendarDays,
    Users,
    Stethoscope,
    LinkIcon,
    ReceiptText,
    Package,
    PillIcon,
  ];
  return (
    <aside className="hidden sm:flex flex-col items-center gap-2 w-10 py-3 bg-white dark:bg-surface-950 border-e border-surface-200 dark:border-surface-800">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
        <Activity size={14} />
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {icons.map((Icon, i) => (
          <button
            key={i}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              i === active
                ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
            )}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>
    </aside>
  );
};

const TopBar: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-between px-4 h-10 bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800">
    <div className="font-display font-semibold text-[12px] text-surface-900 dark:text-white">
      {title}
    </div>
    <div className="flex-1 max-w-xs mx-4">
      <div className="flex items-center gap-1.5 px-2 h-6 rounded-md bg-surface-100 dark:bg-surface-800 text-[10px] text-surface-400">
        <Search size={11} />
        <span>Rechercher patients, rendez-vous, factures…</span>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-surface-400">
      <Globe size={12} />
      <span className="text-[10px] font-medium text-surface-600 dark:text-surface-300">FR</span>
      <Bell size={12} />
      <Moon size={12} />
      <div className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
        D
      </div>
    </div>
  </div>
);

const Shell: React.FC<{ title: string; sidebar?: number; children: React.ReactNode }> = ({
  title,
  sidebar = 0,
  children,
}) => (
  <div className="flex h-full bg-surface-50 dark:bg-surface-900">
    <SidebarStrip active={sidebar} />
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar title={title} />
      <div className="flex-1 p-3 sm:p-4 overflow-hidden">{children}</div>
    </div>
  </div>
);

// ─── Reusable atoms ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: string;
  unit?: string;
  tone?: 'primary' | 'accent' | 'amber' | 'critical';
  icon?: React.ElementType;
}> = ({ label, value, unit, tone = 'primary', icon: Icon }) => {
  const tones = {
    primary: 'border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/20',
    accent: 'border-l-accent-500 bg-accent-50/50 dark:bg-accent-900/20',
    amber: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/20',
    critical: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/20',
  };
  const iconBg = {
    primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300',
    accent: 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
    critical: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
  };
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 border-l-4',
        tones[tone],
      )}
    >
      {Icon && (
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
            iconBg[tone],
          )}
        >
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold truncate">
          {label}
        </div>
        <div className="font-display font-bold text-surface-900 dark:text-white text-base leading-tight">
          {value}
          {unit && (
            <span className="ms-1 text-[10px] text-surface-500 dark:text-surface-400 font-medium">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const TabStrip: React.FC<{ tabs: string[]; active?: number; underline?: boolean }> = ({
  tabs,
  active = 0,
  underline,
}) =>
  underline ? (
    <div className="flex gap-3 border-b border-surface-200 dark:border-surface-800">
      {tabs.map((t, i) => (
        <button
          key={t}
          className={cn(
            'px-1 pb-1.5 text-[10px] font-semibold transition-colors',
            i === active
              ? 'text-primary-600 dark:text-primary-300 border-b-2 border-primary-600'
              : 'text-surface-500 dark:text-surface-400',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  ) : (
    <div className="inline-flex gap-1 p-0.5 rounded-lg bg-surface-100 dark:bg-surface-800">
      {tabs.map((t, i) => (
        <button
          key={t}
          className={cn(
            'px-2 py-1 text-[10px] font-medium rounded-md',
            i === active
              ? 'bg-white dark:bg-surface-900 shadow-soft text-surface-900 dark:text-white'
              : 'text-surface-500 dark:text-surface-400',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );

const Pill: React.FC<{ tone?: 'green' | 'amber' | 'blue' | 'red'; children: React.ReactNode }> = ({
  tone = 'green',
  children,
}) => {
  const tones = {
    green: 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    blue: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
};

// ─── MockDashboard ───────────────────────────────────────────────────────────

export const MockDashboard: React.FC = () => (
  <Shell title="Tableau de bord" sidebar={0}>
    {/* Greeting */}
    <div className="rounded-xl p-3 bg-gradient-to-br from-primary-100/50 to-accent-100/40 dark:from-primary-900/30 dark:to-accent-900/20 border border-surface-200 dark:border-surface-800">
      <div className="text-[9px] text-surface-500 dark:text-surface-400">Samedi 9 Mai</div>
      <div className="font-display font-bold text-sm text-surface-900 dark:text-white">
        Bonjour,{' '}
        <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Demo User
        </span>
      </div>
      <div className="text-[10px] text-surface-500 dark:text-surface-400">Admin de clinique</div>
    </div>

    {/* KPIs */}
    <div className="mt-3 grid grid-cols-4 gap-2">
      <KpiCard label="Revenue today" value="0" unit="DH" tone="primary" icon={Wallet} />
      <KpiCard label="Appointments" value="12" unit="today" tone="accent" icon={CalendarClock} />
      <KpiCard label="Active patients" value="247" tone="primary" icon={Users} />
      <KpiCard label="Cabinet alerts" value="1" unit="action" tone="amber" icon={Package} />
    </div>

    {/* Body grid */}
    <div className="mt-3 grid grid-cols-3 gap-2">
      {/* Agenda */}
      <div className="col-span-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-900 dark:text-white">
            <CalendarClock size={12} className="text-primary-600" />
            Agenda d&rsquo;aujourd&rsquo;hui
          </div>
          <span className="text-[9px] text-surface-400">Saturday, May 9</span>
        </div>
        <div className="mt-2 space-y-1">
          {[
            { t: '09:00', name: 'Sami Pediatric', kind: 'Consultation', status: 'green' as const },
            { t: '10:30', name: 'Alice Demo', kind: 'Suivi', status: 'amber' as const },
            { t: '11:15', name: 'Bob Demo', kind: 'Détartrage', status: 'green' as const },
            { t: '14:00', name: 'Yasmine R.', kind: 'Première visite', status: 'amber' as const },
          ].map((a) => (
            <div
              key={a.t}
              className="flex items-center justify-between p-1.5 rounded-md bg-surface-50 dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/60"
            >
              <div className="flex items-center gap-2">
                <div className="font-mono text-[10px] font-bold text-primary-700 dark:text-primary-300 w-9">
                  {a.t}
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-surface-900 dark:text-white">
                    {a.name}
                  </div>
                  <div className="text-[9px] text-surface-500 dark:text-surface-400">
                    {a.kind}
                  </div>
                </div>
              </div>
              <Pill tone={a.status}>{a.status === 'green' ? 'Confirmé' : 'En attente'}</Pill>
            </div>
          ))}
        </div>
      </div>

      {/* Side col */}
      <div className="col-span-1 space-y-2">
        <div className="rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-2.5">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
            Actions rapides
          </div>
          <div className="mt-1.5 space-y-1">
            {['Nouveau RDV', 'Nouveau patient', 'Créer Facture'].map((a) => (
              <div
                key={a}
                className="flex items-center justify-between p-1.5 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800/50"
              >
                <span className="text-[10px] text-surface-700 dark:text-surface-200">{a}</span>
                <span className="text-surface-400">›</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 p-2.5">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Package size={9} />
            Alertes cabinet
          </div>
          <div className="mt-1.5">
            <div className="text-[10px] font-semibold text-surface-900 dark:text-white">
              Surgical gloves (M)
            </div>
            <div className="text-[9px] text-red-600 dark:text-red-400">Low Stock: 8 (Min: 20)</div>
          </div>
        </div>
      </div>
    </div>
  </Shell>
);

// ─── MockPatientChart ────────────────────────────────────────────────────────

export const MockPatientChart: React.FC = () => (
  <Shell title="Patient" sidebar={2}>
    {/* Patient header */}
    <div className="flex items-center gap-3 px-1">
      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
        S
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-display font-bold text-sm text-surface-900 dark:text-white">
            Sami Pediatric
          </div>
          <Pill tone="blue">M · 8 ANS</Pill>
        </div>
        <div className="text-[10px] text-surface-500 dark:text-surface-400">+212 6 11 44 55 66</div>
        <Pill tone="amber">Pas d&rsquo;assurance</Pill>
      </div>
      <div className="hidden sm:flex gap-4 text-[10px]">
        <div>
          <div className="text-surface-400 uppercase tracking-wide font-semibold text-[8px]">
            Total facturé
          </div>
          <div className="font-bold text-surface-900 dark:text-white">0 DH</div>
        </div>
        <div>
          <div className="text-surface-400 uppercase tracking-wide font-semibold text-[8px]">
            Dernière visite
          </div>
          <div className="font-bold text-surface-900 dark:text-white">mer. 6 mai 2026</div>
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="mt-3">
      <TabStrip
        underline
        active={0}
        tabs={['Vue d\'ensemble', 'Soins', 'Ordonnances', 'Constantes', 'Facturation', 'Documents']}
      />
    </div>

    {/* Body */}
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div className="rounded-lg p-2.5 bg-white dark:bg-surface-900 border-l-4 border-l-red-400 border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-surface-900 dark:text-white flex items-center gap-1">
            <span className="text-red-500">!</span> Antécédents
          </div>
          <span className="text-[9px] text-primary-600">Modifier</span>
        </div>
        <div className="mt-1.5 text-[9px] uppercase tracking-wide text-surface-500 font-semibold">
          Allergies
        </div>
        <div className="text-[10px] text-surface-400 italic">Aucun enregistré</div>
        <div className="mt-1.5 text-[9px] uppercase tracking-wide text-surface-500 font-semibold">
          Conditions
        </div>
        <div className="text-[10px] text-surface-400 italic">Aucun enregistré</div>
      </div>

      <div className="rounded-lg p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold text-surface-700 dark:text-surface-200">
            Prochaine Visite
          </div>
          <CalendarDays size={11} className="text-surface-400" />
        </div>
        <div className="mt-1 font-display font-bold text-[11px] text-surface-900 dark:text-white">
          dim. 10 mai 2026
        </div>
        <div className="text-[10px] text-surface-500 dark:text-surface-400">15:30 – 16:00</div>
      </div>

      <div className="rounded-lg p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold text-surface-700 dark:text-surface-200">
            Solde dû
          </div>
          <Wallet size={11} className="text-surface-400" />
        </div>
        <div className="mt-1 font-display font-bold text-base text-accent-600">
          0.00 <span className="text-[10px] font-medium text-surface-500">DH</span>
        </div>
        <div className="text-[9px] text-surface-500 dark:text-surface-400">Total facturé: 0 DH</div>
      </div>
    </div>

    {/* Notes + history */}
    <div className="mt-2 grid grid-cols-3 gap-2">
      <div className="rounded-lg p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 col-span-1">
        <div className="text-[10px] font-semibold text-surface-700 dark:text-surface-200">Notes</div>
        <div className="mt-1.5 h-12 rounded-md bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-300 dark:border-surface-700" />
      </div>
      <div className="col-span-2 rounded-lg p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        <div className="text-[10px] font-semibold text-surface-700 dark:text-surface-200">
          Historique récent
        </div>
        <div className="mt-1.5 space-y-1">
          {['mer. 6 mai 2026', 'lun. 28 avr. 2026', 'ven. 12 avr. 2026'].map((d, i) => (
            <div
              key={d}
              className="flex items-center justify-between p-1.5 rounded-md bg-surface-50 dark:bg-surface-800/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-accent-100 dark:bg-accent-900/40 text-accent-700 flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <div className="text-[10px] font-medium text-surface-900 dark:text-white">
                    {d}
                  </div>
                  <div className="text-[9px] text-surface-500">Confirmé</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-surface-500">
                {['09:30', '14:00', '11:15'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Shell>
);

// ─── MockCalendarMonth ───────────────────────────────────────────────────────

export const MockCalendarMonth: React.FC = () => (
  <Shell title="Emploi du temps" sidebar={1}>
    {/* Toolbar */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <button className="w-5 h-5 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-surface-500">
            ‹
          </button>
          <button className="w-5 h-5 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-surface-500">
            ›
          </button>
        </div>
        <button className="px-2 py-0.5 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] text-surface-700 dark:text-surface-200">
          Aujourd&rsquo;hui
        </button>
        <span className="font-display font-bold text-[12px] text-surface-900 dark:text-white">
          mai 2026
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TabStrip tabs={['Mois', 'Semaine', 'Jour']} active={0} />
        <button className="px-2 py-1 rounded-md bg-primary-600 text-white text-[10px] font-medium">
          + Nouveau RDV
        </button>
      </div>
    </div>

    {/* Calendar grid */}
    <div className="mt-3 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      <div className="grid grid-cols-7 text-[9px] uppercase tracking-wider font-semibold text-surface-400 border-b border-surface-200 dark:border-surface-800">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="px-2 py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-4 gap-px bg-surface-200 dark:bg-surface-800">
        {Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const isToday = day === 9;
          const hasConfirmed = [6, 13, 20].includes(day);
          const hasPending = [10, 17].includes(day);
          return (
            <div
              key={i}
              className={cn(
                'p-1.5 bg-white dark:bg-surface-900 min-h-[42px] relative',
                isToday && 'bg-primary-50/50 dark:bg-primary-900/20',
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-semibold',
                  isToday
                    ? 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-600 text-white'
                    : 'text-surface-700 dark:text-surface-200',
                )}
              >
                {day}
              </div>
              {hasConfirmed && (
                <div className="mt-1 flex items-center justify-between px-1 rounded bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[8px] font-medium">
                  <span>Confirmé</span>
                  <span>1</span>
                </div>
              )}
              {hasPending && (
                <div className="mt-1 flex items-center justify-between px-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[8px] font-medium">
                  <span>En attente</span>
                  <span>4</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </Shell>
);

// ─── MockStock ───────────────────────────────────────────────────────────────

export const MockStock: React.FC = () => (
  <Shell title="Stock" sidebar={6}>
    <div className="grid grid-cols-4 gap-2">
      <KpiCard label="Articles total" value="4" tone="primary" icon={Package} />
      <KpiCard label="Valeur totale" value="3,320" unit="DH" tone="accent" icon={TrendingUp} />
      <KpiCard label="Stock faible" value="1" tone="critical" icon={Package} />
      <KpiCard label="Expire bientôt" value="0" tone="amber" icon={CalendarDays} />
    </div>

    <div className="mt-3 flex items-center justify-between">
      <TabStrip tabs={['Tous', 'Médicament', 'Consommable', 'Matériel']} active={0} />
      <div className="flex gap-1.5">
        <button className="px-2 py-1 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] text-surface-700 dark:text-surface-200">
          Synchroniser AMMPS
        </button>
        <button className="px-2 py-1 rounded-md bg-primary-600 text-white text-[10px] font-medium">
          + Ajouter Ligne
        </button>
      </div>
    </div>

    <div className="mt-2 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      <div className="grid grid-cols-12 gap-2 px-2 py-1.5 text-[9px] uppercase tracking-wider font-semibold text-surface-400 border-b border-surface-200 dark:border-surface-800">
        <div className="col-span-5">Nom de l&rsquo;article</div>
        <div className="col-span-2">Stock</div>
        <div className="col-span-3">Date expiration</div>
        <div className="col-span-2">Fournisseur</div>
      </div>
      {[
        { name: 'Amoxicillin 500mg', tag: 'antibiotic', stock: 120, max: 200, exp: 'lun. 1 mars 2027', sup: 'MedSupply Maroc', low: false },
        { name: 'Composite resin A2', tag: 'restorative', stock: 15, max: 30, exp: 'mar. 1 juin 2027', sup: 'Dental Depot', low: false },
        { name: 'Paracetamol 1g', tag: 'analgesic', stock: 200, max: 200, exp: 'mar. 1 déc. 2026', sup: 'MedSupply Maroc', low: false },
        { name: 'Surgical gloves (M)', tag: 'PPE', stock: 8, max: 100, exp: '–', sup: 'MedSupply Maroc', low: true },
      ].map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-12 gap-2 px-2 py-2 items-center border-b last:border-b-0 border-surface-200 dark:border-surface-800"
        >
          <div className="col-span-5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center text-primary-600">
              <Package size={11} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-surface-900 dark:text-white">
                {r.name}
              </div>
              <div className="text-[9px] text-surface-500">
                <Pill tone="blue">{r.tag}</Pill>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-surface-900 dark:text-white">
                {r.stock}
              </span>
              {r.low && <Pill tone="red">Bas</Pill>}
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
              <div
                className={cn('h-full', r.low ? 'bg-red-500' : 'bg-accent-500')}
                style={{ width: `${(r.stock / r.max) * 100}%` }}
              />
            </div>
          </div>
          <div className="col-span-3 text-[10px] text-surface-700 dark:text-surface-300">
            <span className="inline-flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-surface-400" />
              {r.exp}
            </span>
          </div>
          <div className="col-span-2 text-[10px] text-surface-700 dark:text-surface-300 truncate">
            {r.sup}
          </div>
        </div>
      ))}
    </div>
  </Shell>
);

// ─── MockInvoices ────────────────────────────────────────────────────────────

export const MockInvoices: React.FC = () => (
  <Shell title="Factures" sidebar={5}>
    <div className="flex items-center justify-between">
      <TabStrip tabs={['Aujourd\'hui', 'Ce mois', 'Mois dernier', 'Cette année']} active={1} />
      <button className="px-2 py-1 rounded-md bg-primary-600 text-white text-[10px] font-medium inline-flex items-center gap-1">
        <ReceiptText size={10} />
        Créer Facture
      </button>
    </div>

    <div className="mt-3 grid grid-cols-4 gap-2">
      <KpiCard label="Total facturé" value="14,820" unit="DH" tone="primary" icon={ReceiptText} />
      <KpiCard label="Payé" value="11,450" unit="DH" tone="accent" icon={CreditCard} />
      <KpiCard label="Dû" value="3,370" unit="DH" tone="critical" icon={Wallet} />
      <KpiCard label="Facture moyenne" value="412" unit="DH" tone="primary" icon={UserRound} />
    </div>

    <div className="mt-3 grid grid-cols-3 gap-2">
      {/* Bar chart */}
      <div className="col-span-2 rounded-lg p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-surface-900 dark:text-white inline-flex items-center gap-1">
            <TrendingUp size={11} className="text-primary-600" />
            Tendance des revenus
          </div>
          <Pill tone="blue">26 factures</Pill>
        </div>
        <div className="mt-3 flex items-end gap-1 h-16">
          {[30, 50, 35, 70, 55, 80, 45, 60, 90, 65, 50, 75, 85, 95, 70, 80, 60, 90, 100, 75, 65, 80, 95, 70, 60, 85].map(
            (h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-primary-300 to-primary-500 dark:from-primary-700 dark:to-primary-500"
                style={{ height: `${h}%` }}
              />
            ),
          )}
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-surface-400 font-mono">
          <span>1</span>
          <span>15</span>
          <span>26</span>
        </div>
      </div>
      {/* Donut */}
      <div className="rounded-lg p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        <div className="text-[11px] font-semibold text-surface-900 dark:text-white inline-flex items-center gap-1">
          <CreditCard size={11} className="text-primary-600" />
          Modes de paiement
        </div>
        <div className="mt-3 flex items-center justify-center">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="4" className="text-surface-200 dark:text-surface-700 fill-none" />
              <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="4" strokeDasharray="50 88" className="text-primary-500 fill-none" />
              <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="4" strokeDasharray="25 88" strokeDashoffset="-50" className="text-accent-500 fill-none" />
              <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="4" strokeDasharray="13 88" strokeDashoffset="-75" className="text-amber-400 fill-none" />
            </svg>
          </div>
        </div>
        <div className="mt-2 space-y-0.5 text-[9px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-surface-600 dark:text-surface-300">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              Espèces
            </span>
            <span className="font-semibold">57%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-surface-600 dark:text-surface-300">
              <span className="w-2 h-2 rounded-full bg-accent-500" />
              Carte
            </span>
            <span className="font-semibold">28%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-surface-600 dark:text-surface-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Virement
            </span>
            <span className="font-semibold">15%</span>
          </div>
        </div>
      </div>
    </div>
  </Shell>
);

// ─── MockPrescription ────────────────────────────────────────────────────────

export const MockPrescription: React.FC = () => (
  <Shell title="Patient" sidebar={2}>
    <div className="relative h-full">
      {/* Dimmed underlay hint */}
      <div className="absolute inset-0 rounded-md bg-surface-900/5 dark:bg-black/20" />

      <div className="relative mx-auto max-w-full rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-elevated">
        <div className="flex items-center justify-between px-3 h-8 border-b border-surface-200 dark:border-surface-800">
          <div className="text-[11px] font-bold text-surface-900 dark:text-white">
            Créer Ordonnance
          </div>
          <span className="text-surface-400 text-[12px]">×</span>
        </div>
        <div className="grid grid-cols-12 gap-2 p-2.5">
          {/* Drug list */}
          <div className="col-span-4 space-y-1">
            <div className="px-2 h-6 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px] text-surface-500 flex items-center">
              <Search size={10} className="me-1" />
              Rechercher…
            </div>
            <div className="rounded-md p-1.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
              <div className="text-[10px] font-semibold text-surface-900 dark:text-white">
                Amoxicillin 500mg
              </div>
              <div className="flex items-center justify-between text-[9px] text-surface-500">
                <span>capsule</span>
                <span>120 left</span>
              </div>
            </div>
            <div className="rounded-md p-1.5 border-2 border-primary-500 bg-primary-50/40 dark:bg-primary-900/20">
              <div className="text-[10px] font-semibold text-surface-900 dark:text-white">
                Paracetamol 1g
              </div>
              <div className="flex items-center justify-between text-[9px] text-surface-500">
                <span>tablet</span>
                <span>200 left</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="col-span-4 space-y-2">
            <div>
              <div className="flex items-center gap-1.5">
                <div className="font-display font-bold text-[12px] text-surface-900 dark:text-white">
                  Paracetamol 1g
                </div>
                <Pill tone="blue">tablet</Pill>
              </div>
              <div className="text-[9px] text-surface-500 inline-flex items-center gap-1">
                <Package size={9} /> Stock: 200 available
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-semibold text-surface-500">
                Dosage
              </div>
              <div className="mt-0.5 h-5 rounded-md bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700" />
              <div className="mt-1 flex flex-wrap gap-1">
                {['500mg', '1g', '1 Tablet', '5ml'].map((d) => (
                  <span
                    key={d}
                    className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-semibold text-surface-500">
                Fréquence
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {['1x / day', '2x / day', '3x / day', 'Before meal'].map((f) => (
                  <span
                    key={f}
                    className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-semibold text-surface-500">
                Durée
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {['3 days', '5 days', '7 days', '1 month'].map((d) => (
                  <span
                    key={d}
                    className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="col-span-4">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-surface-500 inline-flex items-center gap-1">
              <FileText size={9} /> Prescription Preview
            </div>
            <div className="mt-1 rounded-md p-2 bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700 space-y-1.5">
              <div className="rounded-md p-1.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <div className="text-[10px] font-bold text-surface-900 dark:text-white">
                  Amoxicillin 500mg
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[8px] text-surface-500">
                  <Pill tone="blue">500mg</Pill>
                  <span>1x / day</span>
                  <span className="text-surface-300">·</span>
                  <span>3 days</span>
                </div>
              </div>
              <div className="rounded-md p-1.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <div className="text-[10px] font-bold text-surface-900 dark:text-white">
                  Paracetamol 1g
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[8px] text-surface-500">
                  <Pill tone="blue">1g</Pill>
                  <span>3x / day</span>
                  <span className="text-surface-300">·</span>
                  <span>5 days</span>
                </div>
              </div>
            </div>
            <button className="mt-2 w-full px-2 py-1 rounded-md bg-primary-600 text-white text-[10px] font-semibold">
              Save Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  </Shell>
);

// ─── Compact mocks for the workflow strip ────────────────────────────────────

export const MockBookCard: React.FC = () => (
  <div className="h-full bg-surface-50 dark:bg-surface-900 p-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-display font-semibold text-surface-900 dark:text-white">
        Nouveau RDV
      </span>
      <span className="text-[10px] text-primary-600">10:30 – 11:00</span>
    </div>
    <div className="grid grid-cols-4 gap-1">
      {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'].map(
        (t, i) => (
          <div
            key={t}
            className={cn(
              'py-1 rounded-md text-center text-[9px] font-medium border',
              i === 5
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200',
            )}
          >
            {t}
          </div>
        ),
      )}
    </div>
    <div className="mt-2 flex items-center gap-1">
      <Pill tone="green">Confirmé</Pill>
      <Pill tone="amber">En attente</Pill>
    </div>
  </div>
);

export const MockSeeCard: React.FC = () => (
  <div className="h-full bg-surface-50 dark:bg-surface-900 p-3 space-y-2">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 font-bold text-[10px]">
        S
      </div>
      <div>
        <div className="font-display font-bold text-[11px] text-surface-900 dark:text-white">
          Sami Pediatric
        </div>
        <div className="text-[9px] text-surface-500">M · 8 ans</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-1.5">
      {[
        { l: 'BP', v: '120/80' },
        { l: 'HR', v: '72 bpm' },
        { l: 'Temp', v: '36.6°C' },
        { l: 'SpO₂', v: '98%' },
      ].map((m) => (
        <div
          key={m.l}
          className="px-2 py-1 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
        >
          <div className="text-[8px] uppercase tracking-wider font-semibold text-surface-500">
            {m.l}
          </div>
          <div className="text-[10px] font-bold text-surface-900 dark:text-white">{m.v}</div>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-1">
      <HeartPulse size={10} className="text-accent-600" />
      <span className="text-[9px] text-surface-500">Stable</span>
    </div>
  </div>
);

export const MockPrescribeCard: React.FC = () => (
  <div className="h-full bg-surface-50 dark:bg-surface-900 p-3 space-y-1.5">
    <div className="text-[9px] uppercase tracking-wider font-semibold text-primary-600 inline-flex items-center gap-1">
      <Syringe size={9} /> Ordonnance
    </div>
    {[
      { name: 'Amoxicillin 500mg', d: '500mg • 3x / day • 7 days' },
      { name: 'Paracetamol 1g', d: '1g • si douleur • 5 days' },
    ].map((rx) => (
      <div
        key={rx.name}
        className="px-2 py-1.5 rounded-md bg-white dark:bg-surface-800 border-l-2 border-l-primary-500 border border-surface-200 dark:border-surface-700"
      >
        <div className="text-[10px] font-bold text-surface-900 dark:text-white">{rx.name}</div>
        <div className="text-[9px] text-surface-500">{rx.d}</div>
      </div>
    ))}
    <div className="flex items-center justify-end">
      <span className="px-2 py-0.5 rounded-md bg-primary-600 text-white text-[9px] font-semibold">
        Imprimer
      </span>
    </div>
  </div>
);

export const MockBillCard: React.FC = () => (
  <div className="h-full bg-surface-50 dark:bg-surface-900 p-3 space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="text-[9px] uppercase tracking-wider font-semibold text-accent-700">
        Facture #094CB7A9
      </div>
      <Pill tone="green">Payée</Pill>
    </div>
    <div className="space-y-1">
      {[
        { l: 'Consultation', v: '300 DH' },
        { l: 'Détartrage', v: '450 DH' },
        { l: 'Fluoride', v: '120 DH' },
      ].map((it) => (
        <div
          key={it.l}
          className="flex items-center justify-between text-[10px] text-surface-700 dark:text-surface-300"
        >
          <span>{it.l}</span>
          <span className="font-mono font-semibold">{it.v}</span>
        </div>
      ))}
    </div>
    <div className="border-t border-dashed border-surface-300 dark:border-surface-700 pt-1.5 flex items-center justify-between">
      <span className="text-[10px] font-bold text-surface-900 dark:text-white">Total</span>
      <span className="font-display font-bold text-[12px] text-accent-600">870 DH</span>
    </div>
  </div>
);
