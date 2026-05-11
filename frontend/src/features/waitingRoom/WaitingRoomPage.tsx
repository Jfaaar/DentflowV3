import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  DoorOpen,
  Loader2,
  PhoneOff,
  Play,
  Plus,
  RefreshCw,
  Stethoscope,
  Users,
  XCircle,
} from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../language/LanguageContext';
import { useAuth } from '../auth/useAuth';
import { hasPermission } from '../../lib/permissions';
import { appointmentsService } from '../../lib/services/appointments';
import { PatientSelect } from '../patients/components/PatientSelect';
import type { Appointment, Patient } from '../../types';
import { cn } from '../../lib/utils';
import { toastError, toastSuccess } from '../../lib/toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POLL_MS = 5_000;
const TICK_MS = 30_000; // wait-time recompute cadence

const todayBounds = (): { from: string; to: string } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
};

const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const fmtElapsed = (sinceIso: string | undefined, _tick: number): string => {
  if (!sinceIso) return '';
  const ms = Date.now() - new Date(sinceIso).getTime();
  if (ms < 0) return '0m';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';

type ColumnKey = 'expected' | 'waiting' | 'inConsultation' | 'done';

const bucketOf = (apt: Appointment): ColumnKey | null => {
  switch (apt.status) {
    case 'pending':
    case 'confirmed':
    case 'rescheduled':
      return apt.checkedInAt ? 'waiting' : 'expected';
    case 'checked_in':
      return 'waiting';
    case 'in_progress':
      return 'inConsultation';
    case 'completed':
    case 'no_show':
    case 'canceled':
      return 'done';
    default:
      return null;
  }
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const WaitingRoomPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const canCheckIn = hasPermission(user?.role, 'appointments.checkin');
  const canUpdate = hasPermission(user?.role, 'appointments.update');
  const canCreate = hasPermission(user?.role, 'appointments.create');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0); // forces wait-time chips to recompute
  const [showWalkIn, setShowWalkIn] = useState(false);
  const lastFetchAbortRef = useRef<AbortController | null>(null);

  const fetchToday = useCallback(async () => {
    // Cancel any in-flight fetch so we never apply stale data over fresh.
    lastFetchAbortRef.current?.abort();
    const ctl = new AbortController();
    lastFetchAbortRef.current = ctl;
    try {
      const { from, to } = todayBounds();
      const r = await appointmentsService.list({
        pageSize: 500,
        filters: { from, to },
      });
      if (ctl.signal.aborted) return;
      setAppointments(r.data);
      setLastUpdated(new Date());
    } catch (e) {
      if (!ctl.signal.aborted) toastError(e);
    } finally {
      if (!ctl.signal.aborted) setIsLoading(false);
    }
  }, []);

  // Initial load + polling (paused when tab is hidden).
  useEffect(() => {
    void fetchToday();
    let intervalId: number | undefined;
    const start = () => {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => void fetchToday(), POLL_MS);
    };
    const stop = () => window.clearInterval(intervalId);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
      else {
        void fetchToday();
        start();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      lastFetchAbortRef.current?.abort();
    };
  }, [fetchToday]);

  // Tick to keep wait-time chips fresh.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const buckets = useMemo(() => {
    const out: Record<ColumnKey, Appointment[]> = {
      expected: [],
      waiting: [],
      inConsultation: [],
      done: [],
    };
    for (const a of appointments) {
      const k = bucketOf(a);
      if (k) out[k].push(a);
    }
    out.expected.sort((a, b) => a.start.localeCompare(b.start));
    out.waiting.sort((a, b) =>
      (a.checkedInAt ?? a.start).localeCompare(b.checkedInAt ?? b.start),
    );
    out.inConsultation.sort((a, b) => a.start.localeCompare(b.start));
    out.done.sort((a, b) =>
      (b.completedAt ?? b.start).localeCompare(a.completedAt ?? a.start),
    );
    return out;
  }, [appointments]);

  const stats = useMemo(() => {
    const waitingMs = buckets.waiting
      .map((a) => (a.checkedInAt ? Date.now() - new Date(a.checkedInAt).getTime() : 0))
      .filter((m) => m > 0);
    const avg =
      waitingMs.length > 0
        ? Math.round(waitingMs.reduce((s, m) => s + m, 0) / waitingMs.length / 60_000)
        : 0;
    return {
      expected: buckets.expected.length,
      waiting: buckets.waiting.length,
      inConsultation: buckets.inConsultation.length,
      done: buckets.done.length,
      avgWaitMins: avg,
    };
  }, [buckets]);

  const transition = useCallback(
    async (id: string, action: 'checkIn' | 'start' | 'complete' | 'noShow') => {
      try {
        // Optimistic: drop the row out of its current bucket immediately;
        // server response replaces it with the canonical row.
        const prev = appointments;
        const updated = await appointmentsService[action](id);
        setAppointments((cur) => {
          const others = cur.filter((a) => a.id !== id);
          return [...others, updated];
        });
        const labelMap = {
          checkIn: t('checkedIn' as any) || 'Checked in',
          start: t('inConsultation' as any) || 'In consultation',
          complete: t('done' as any) || 'Done',
          noShow: t('markNoShow' as any) || 'No-show',
        } as const;
        toastSuccess(labelMap[action]);
        // Re-fetch in the background to catch any server-side side-effects.
        void fetchToday();
        void prev;
      } catch (e) {
        toastError(e);
      }
    },
    [appointments, fetchToday, t],
  );

  const updatedAgo = useMemo(() => {
    if (!lastUpdated) return null;
    void tick;
    const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (secs < 5) return t('updatedJustNow' as any) || 'just now';
    return (t('updatedAgo' as any) || 'updated {n}s ago').replace('{n}', String(secs));
  }, [lastUpdated, t, tick]);

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('waitingRoom' as any) || 'Waiting room'}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchToday()}
            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title={t('refresh' as any) || 'Refresh'}
          >
            <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
          </button>
          {canCreate && (
            <Button onClick={() => setShowWalkIn(true)} className="gap-2">
              <Plus size={16} /> {t('addWalkIn' as any) || 'Walk-in'}
            </Button>
          )}
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={CalendarClock}
              label={t('expected' as any) || 'Expected'}
              value={stats.expected.toString()}
              tone="primary"
            />
            <StatCard
              icon={Clock}
              label={t('waiting' as any) || 'Waiting'}
              value={stats.waiting.toString()}
              hint={
                stats.avgWaitMins > 0
                  ? `${t('avgWait' as any) || 'avg'} ${stats.avgWaitMins}m`
                  : undefined
              }
              tone="amber"
            />
            <StatCard
              icon={Stethoscope}
              label={t('inConsultation' as any) || 'In consultation'}
              value={stats.inConsultation.toString()}
              tone="accent"
            />
            <StatCard
              icon={CheckCircle2}
              label={t('done' as any) || 'Done'}
              value={stats.done.toString()}
              tone="primary"
            />
          </div>

          {updatedAgo && (
            <div className="text-xs text-surface-400 text-end">{updatedAgo}</div>
          )}

          {isLoading && appointments.length === 0 ? (
            <div className="flex items-center justify-center p-12 text-surface-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Column
                title={t('expected' as any) || 'Expected'}
                tone="primary"
                items={buckets.expected}
                emptyText={t('noExpected' as any) || 'No upcoming arrivals'}
                renderActions={(apt) =>
                  canCheckIn ? (
                    <>
                      <ActionButton
                        icon={DoorOpen}
                        label={t('checkIn' as any) || 'Check in'}
                        onClick={() => void transition(apt.id, 'checkIn')}
                        tone="primary"
                      />
                      <ActionButton
                        icon={PhoneOff}
                        label={t('markNoShow' as any) || 'No-show'}
                        onClick={() => void transition(apt.id, 'noShow')}
                        tone="ghost"
                      />
                    </>
                  ) : null
                }
                tick={tick}
              />
              <Column
                title={t('waiting' as any) || 'Waiting'}
                tone="amber"
                items={buckets.waiting}
                emptyText={t('noWaiting' as any) || 'Waiting room is empty'}
                renderActions={(apt) =>
                  canUpdate ? (
                    <>
                      <ActionButton
                        icon={Play}
                        label={t('startConsultation' as any) || 'Start'}
                        onClick={() => void transition(apt.id, 'start')}
                        tone="accent"
                      />
                      <ActionButton
                        icon={PhoneOff}
                        label={t('markNoShow' as any) || 'No-show'}
                        onClick={() => void transition(apt.id, 'noShow')}
                        tone="ghost"
                      />
                    </>
                  ) : null
                }
                tick={tick}
              />
              <Column
                title={t('inConsultation' as any) || 'In consultation'}
                tone="accent"
                items={buckets.inConsultation}
                emptyText={t('noConsulting' as any) || 'No active consultations'}
                renderActions={(apt) =>
                  canUpdate ? (
                    <ActionButton
                      icon={Check}
                      label={t('markDone' as any) || 'Mark done'}
                      onClick={() => void transition(apt.id, 'complete')}
                      tone="primary"
                    />
                  ) : null
                }
                tick={tick}
              />
              <Column
                title={t('done' as any) || 'Done'}
                tone="surface"
                items={buckets.done}
                emptyText={t('noDoneYet' as any) || 'Nothing finished yet'}
                renderActions={() => null}
                tick={tick}
              />
            </div>
          )}
        </div>
      </div>

      {showWalkIn && canCreate && (
        <WalkInModal
          onClose={() => setShowWalkIn(false)}
          onCreated={async () => {
            setShowWalkIn(false);
            await fetchToday();
          }}
        />
      )}
    </div>
  );
};

// ─── Column ──────────────────────────────────────────────────────────────────

interface ColumnProps {
  title: string;
  tone: 'primary' | 'accent' | 'amber' | 'surface';
  items: Appointment[];
  emptyText: string;
  renderActions: (apt: Appointment) => React.ReactNode;
  tick: number;
}

const COLUMN_TONES: Record<ColumnProps['tone'], { ring: string; pill: string }> = {
  primary: {
    ring: 'border-primary-200 dark:border-primary-800',
    pill: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  },
  accent: {
    ring: 'border-accent-200 dark:border-accent-800',
    pill: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  },
  amber: {
    ring: 'border-amber-200 dark:border-amber-800',
    pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  surface: {
    ring: 'border-surface-200 dark:border-surface-800',
    pill: 'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
  },
};

const Column: React.FC<ColumnProps> = ({ title, tone, items, emptyText, renderActions, tick }) => {
  const t = COLUMN_TONES[tone];
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-white dark:bg-surface-900 border-2 min-h-[20rem]',
        t.ring,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <h3 className="font-display text-sm font-bold text-surface-900 dark:text-white tracking-wide uppercase">
          {title}
        </h3>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', t.pill)}>
          {items.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-surface-400 text-sm italic">
            {emptyText}
          </div>
        ) : (
          items.map((apt) => (
            <PatientCard
              key={apt.id}
              apt={apt}
              actions={renderActions(apt)}
              tick={tick}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Patient card ────────────────────────────────────────────────────────────

const PatientCard: React.FC<{
  apt: Appointment;
  actions: React.ReactNode;
  tick: number;
}> = ({ apt, actions, tick }) => {
  const { t } = useLanguage();
  const wait = fmtElapsed(apt.checkedInAt, tick);
  const isLate =
    apt.status === 'checked_in' &&
    apt.checkedInAt &&
    Date.now() - new Date(apt.checkedInAt).getTime() > 30 * 60_000;
  return (
    <div
      className={cn(
        'group p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 border transition-all',
        isLate
          ? 'border-amber-300 dark:border-amber-700'
          : 'border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-700',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-bold flex items-center justify-center shrink-0"
          aria-hidden
        >
          {initials(apt.patientName || '?')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-surface-900 dark:text-white truncate">
            {apt.patientName || apt.patientId}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
            <span className="font-mono">{fmtTime(apt.start)}</span>
            {apt.appointmentType && (
              <span className="px-1.5 py-0.5 rounded-md bg-surface-200/80 dark:bg-surface-700/60 text-[10px] uppercase tracking-wide font-medium">
                {apt.appointmentType}
              </span>
            )}
          </div>
          {(apt.doctorName || apt.roomName) && (
            <div className="mt-1 flex items-center gap-2 text-[11px] text-surface-500 dark:text-surface-400">
              {apt.doctorName && (
                <span className="inline-flex items-center gap-1">
                  <Stethoscope size={11} />
                  {apt.doctorName}
                </span>
              )}
              {apt.roomName && (
                <span className="inline-flex items-center gap-1">
                  <DoorOpen size={11} />
                  {apt.roomName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {wait && (
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold',
            isLate
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300',
          )}
        >
          <Clock size={10} />
          {t('waitTime' as any) || 'wait'} {wait}
        </div>
      )}
      {apt.status === 'no_show' && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          <XCircle size={10} />
          {t('markNoShow' as any) || 'No-show'}
        </div>
      )}

      {actions && (
        <div className="mt-3 flex flex-wrap gap-1.5">{actions}</div>
      )}
    </div>
  );
};

// ─── Action button ───────────────────────────────────────────────────────────

const ActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone: 'primary' | 'accent' | 'ghost';
}> = ({ icon: Icon, label, onClick, tone }) => {
  const tones = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white shadow-soft',
    accent:
      'bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-glow-accent',
    ghost:
      'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-semibold transition-all active:scale-95',
        tones[tone],
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
};

// ─── Stat card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  tone: 'primary' | 'accent' | 'amber';
}> = ({ icon: Icon, label, value, hint, tone }) => {
  const tones = {
    primary: {
      ring: 'border-l-primary-500 bg-primary-50/40 dark:bg-primary-900/10',
      icon: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300',
    },
    accent: {
      ring: 'border-l-accent-500 bg-accent-50/40 dark:bg-accent-900/10',
      icon: 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300',
    },
    amber: {
      ring: 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-900/10',
      icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
    },
  };
  const t = tones[tone];
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 border-l-4',
        t.ring,
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', t.icon)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold truncate">
          {label}
        </div>
        <div className="font-display font-bold text-2xl text-surface-900 dark:text-white">
          {value}
          {hint && (
            <span className="ms-2 text-xs font-normal text-surface-500 dark:text-surface-400">
              {hint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Walk-in modal ───────────────────────────────────────────────────────────

const WalkInModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const { t } = useLanguage();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!patient) {
      toastError(new Error(t('selectPatient' as any) || 'Pick a patient'));
      return;
    }
    setBusy(true);
    try {
      const start = new Date();
      const end = new Date(start.getTime() + duration * 60_000);
      const created = await appointmentsService.create({
        patientId: patient.id,
        patientName: patient.name,
        start: start.toISOString(),
        end: end.toISOString(),
        status: 'checked_in',
        observation: reason || undefined,
      });
      // The create endpoint inserts with whatever status we pass, but
      // checked_in_at is only filled by the dedicated check-in route.
      // Force-set it so the wait timer starts immediately.
      await appointmentsService.checkIn(created.id);
      toastSuccess(t('addWalkIn' as any) || 'Walk-in added');
      onCreated();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t('addWalkIn' as any) || 'Add walk-in'} maxWidth="lg">
      <div className="space-y-3">
        <PatientSelect value={patient} onChange={setPatient} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('estimatedDuration' as any) || 'Duration (min)'}
            type="number"
            min={5}
            max={240}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 30)}
          />
          <Input
            label={t('observation' as any) || 'Reason'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
          <Users size={14} />
          {t('walkInHint' as any) ||
            'A new appointment will be created starting now and immediately marked as checked in.'}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} isLoading={busy}>
            {t('confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
