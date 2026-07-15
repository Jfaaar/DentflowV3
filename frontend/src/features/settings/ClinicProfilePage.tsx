// Clinic profile — edits the scalar clinic_settings fields that previously
// had no UI: logo, tax ID, currency, timezone, default language, default
// appointment length, invoice numbering, and a simple per-day working-hours
// editor (one open block per day; closed = no block).
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Save, AlertCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '../auth/useAuth';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type ClinicSettings,
} from './api/settingsApi';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = (typeof DAYS)[number];
type DayHours = { open: boolean; start: string; end: string };

const DEFAULT_DAY: DayHours = { open: false, start: '09:00', end: '17:00' };

type WorkingHoursMap = ClinicSettings['workingHours'];

function hoursToForm(wh: WorkingHoursMap): Record<Day, DayHours> {
  const out = {} as Record<Day, DayHours>;
  for (const d of DAYS) {
    const ranges = wh?.[d];
    if (ranges && ranges.length > 0) {
      out[d] = { open: true, start: ranges[0].start, end: ranges[0].end };
    } else {
      out[d] = { ...DEFAULT_DAY };
    }
  }
  return out;
}

function formToHours(form: Record<Day, DayHours>): WorkingHoursMap {
  const out: NonNullable<WorkingHoursMap> = {};
  for (const d of DAYS) {
    out[d] = form[d].open ? [{ start: form[d].start, end: form[d].end }] : [];
  }
  return out;
}

const CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP'];
const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

export const ClinicProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [logoUrl, setLogoUrl] = useState('');
  const [taxId, setTaxId] = useState('');
  const [currency, setCurrency] = useState('MAD');
  const [timezone, setTimezone] = useState('Africa/Casablanca');
  const [defaultLanguage, setDefaultLanguage] = useState('fr');
  const [defaultAppointmentMinutes, setDefaultAppointmentMinutes] = useState(30);
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState('INV-{YYYY}-{SEQ}');
  const [hours, setHours] = useState<Record<Day, DayHours>>(() => hoursToForm(undefined));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    setLogoUrl(data.logoUrl ?? '');
    setTaxId(data.taxId ?? '');
    setCurrency(data.currency ?? 'MAD');
    setTimezone(data.timezone ?? 'Africa/Casablanca');
    setDefaultLanguage(data.defaultLanguage ?? 'fr');
    setDefaultAppointmentMinutes(data.defaultAppointmentMinutes ?? 30);
    setInvoiceNumberFormat(data.invoiceNumberFormat ?? 'INV-{YYYY}-{SEQ}');
    setHours(hoursToForm(data.workingHours));
  }, [data]);

  const isAdmin = user?.role === 'clinic_admin' || user?.role === 'super_admin';

  const setDay = (d: Day, patch: Partial<DayHours>) =>
    setHours((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));

  const handleSave = async () => {
    setErrorMsg(null);
    setSavedAt(null);
    try {
      await updateSettings({
        logoUrl: logoUrl || undefined,
        taxId: taxId || undefined,
        currency,
        timezone,
        defaultLanguage,
        defaultAppointmentMinutes,
        invoiceNumberFormat,
        workingHours: formToHours(hours),
      }).unwrap();
      setSavedAt(Date.now());
    } catch (e: unknown) {
      const msg = (e as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setErrorMsg(msg ?? t('clinicProfileSaveFailed', 'Failed to save clinic profile'));
    }
  };

  const invoicePreview = useMemo(
    () =>
      invoiceNumberFormat
        .replace('{YYYY}', String(new Date().getFullYear()))
        .replace('{YY}', String(new Date().getFullYear()).slice(-2))
        .replace('{SEQ}', String((data?.invoiceSeq ?? 0) + 1).padStart(4, '0')),
    [invoiceNumberFormat, data?.invoiceSeq],
  );

  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-surface-500">
        {t('clinicProfilePermissionDenied', 'You do not have permission to edit the clinic profile.')}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {t('settingsTabClinic', 'Clinic profile')}
          </h1>
          <p className="text-surface-500">
            {t('clinicProfileSubtitle', 'Logo, billing identifiers, locale defaults and opening hours.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-sm text-green-600 dark:text-green-400">{t('saved', 'Saved')}</span>
          )}
          <Button onClick={handleSave} isLoading={isSaving} disabled={isLoading || isSaving}>
            <Save size={18} className="mr-2" />
            {t('save', 'Save')}
          </Button>
        </div>
      </header>

      {errorMsg && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-300">
              <Building2 size={20} />
            </div>
            <h2 className="text-lg font-semibold">{t('clinicProfileIdentity', 'Identity & billing')}</h2>
          </div>
          <div className="space-y-4">
            <Input
              label={t('clinicLogoUrl', 'Logo URL')}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              label={t('clinicTaxId', 'Tax ID / ICE')}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-surface-500 mb-1 block">{t('clinicCurrency', 'Currency')}</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-surface-500 mb-1 block">{t('clinicDefaultLanguage', 'Default language')}</span>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </label>
            </div>
            <Input
              label={t('clinicTimezone', 'Timezone (IANA)')}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Africa/Casablanca"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('clinicDefaultApptMinutes', 'Default appointment (min)')}
                type="number"
                min={5}
                max={480}
                value={defaultAppointmentMinutes}
                onChange={(e) => setDefaultAppointmentMinutes(Number(e.target.value) || 30)}
              />
              <Input
                label={t('clinicInvoiceFormat', 'Invoice number format')}
                value={invoiceNumberFormat}
                onChange={(e) => setInvoiceNumberFormat(e.target.value)}
              />
            </div>
            <p className="text-xs text-surface-400">
              {t('clinicInvoicePreview', 'Next invoice number')}: <code className="text-surface-600 dark:text-surface-300">{invoicePreview}</code>
              {' · '}
              {t('clinicInvoicePlaceholders', 'placeholders: {YYYY} {YY} {SEQ}')}
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-accent-100 dark:bg-accent-900/30 p-2 rounded-lg text-accent-600 dark:text-accent-300">
              <Clock size={20} />
            </div>
            <h2 className="text-lg font-semibold">{t('clinicWorkingHours', 'Working hours')}</h2>
          </div>
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-24 shrink-0">
                  <input
                    type="checkbox"
                    checked={hours[d].open}
                    onChange={(e) => setDay(d, { open: e.target.checked })}
                    className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm capitalize">{t(`day_${d}`, d)}</span>
                </label>
                <input
                  type="time"
                  value={hours[d].start}
                  disabled={!hours[d].open}
                  onChange={(e) => setDay(d, { start: e.target.value })}
                  className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1 text-sm disabled:opacity-40"
                />
                <span className="text-surface-400 text-sm">–</span>
                <input
                  type="time"
                  value={hours[d].end}
                  disabled={!hours[d].open}
                  onChange={(e) => setDay(d, { end: e.target.value })}
                  className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1 text-sm disabled:opacity-40"
                />
                {!hours[d].open && (
                  <span className="text-xs text-surface-400">{t('closed', 'Closed')}</span>
                )}
              </div>
            ))}
            <p className="text-xs text-surface-400 pt-1">
              {t('clinicWorkingHoursNote', 'One open block per day. Multi-block schedules can be edited via the API.')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
