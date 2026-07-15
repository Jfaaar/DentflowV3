import React, { useState } from 'react';
import { Activity, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateVitalMutation, type VitalSigns } from './api/medicalApi';

interface Props {
  patientId: string;
  onSaved?: (v: VitalSigns) => void;
}

type FormState = {
  systolicBp: string;
  diastolicBp: string;
  heartRate: string;
  temperatureC: string;
  respiratoryRate: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  painScore: string;
  notes: string;
};

const blank: FormState = {
  systolicBp: '',
  diastolicBp: '',
  heartRate: '',
  temperatureC: '',
  respiratoryRate: '',
  spo2: '',
  weightKg: '',
  heightCm: '',
  painScore: '',
  notes: '',
};

function toNum(s: string): number | undefined {
  if (!s.trim()) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export const VitalsForm: React.FC<Props> = ({ patientId, onSaved }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(blank);
  const [createVital, { isLoading, error }] = useCreateVitalMutation();
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setFieldErrors({});
    try {
      const saved = await createVital({
        patientId,
        systolicBp: toNum(state.systolicBp),
        diastolicBp: toNum(state.diastolicBp),
        heartRate: toNum(state.heartRate),
        temperatureC: toNum(state.temperatureC),
        respiratoryRate: toNum(state.respiratoryRate),
        spo2: toNum(state.spo2),
        weightKg: toNum(state.weightKg),
        heightCm: toNum(state.heightCm),
        painScore: toNum(state.painScore),
        notes: state.notes || undefined,
      }).unwrap();
      setState(blank);
      onSaved?.(saved);
    } catch (e: unknown) {
      const errBody = (e as {
        data?: {
          error?: {
            message?: string;
            details?: { fieldErrors?: Record<string, string[]> };
          };
        };
      })?.data?.error;
      const rawFieldErrors = errBody?.details?.fieldErrors;
      if (rawFieldErrors) {
        const flat: FieldErrors = {};
        for (const [key, msgs] of Object.entries(rawFieldErrors)) {
          if (msgs?.[0]) flat[key as keyof FormState] = msgs[0];
        }
        setFieldErrors(flat);
      }
      setErrMsg(errBody?.message ?? t('vitalsSaveFailed', 'Failed to save vitals'));
    }
  };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((p) => ({ ...p, [k]: e.target.value }));
    if (fieldErrors[k]) {
      setFieldErrors((p) => {
        const next = { ...p };
        delete next[k];
        return next;
      });
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600">
          <Activity size={20} />
        </div>
        <h3 className="text-lg font-semibold">{t('vitalsRecord', 'Record vitals')}</h3>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Input label={t('systolicBp', 'Systolic BP')} type="number" min={0} max={400} step={1} value={state.systolicBp} onChange={set('systolicBp')} placeholder="120" error={fieldErrors.systolicBp} />
        <Input label={t('diastolicBp', 'Diastolic BP')} type="number" min={0} max={300} step={1} value={state.diastolicBp} onChange={set('diastolicBp')} placeholder="80" error={fieldErrors.diastolicBp} />
        <Input label={t('heartRate', 'Heart rate')} type="number" min={0} max={400} step={1} value={state.heartRate} onChange={set('heartRate')} placeholder="72" error={fieldErrors.heartRate} />
        <Input label={t('temperatureC', 'Temperature (°C)')} type="number" min={20} max={50} step="0.1" value={state.temperatureC} onChange={set('temperatureC')} placeholder="36.6" error={fieldErrors.temperatureC} />
        <Input label={t('respiratoryRate', 'Respiratory rate')} type="number" min={0} max={120} step={1} value={state.respiratoryRate} onChange={set('respiratoryRate')} placeholder="16" error={fieldErrors.respiratoryRate} />
        <Input label={t('spo2', 'SpO₂ (%)')} type="number" min={0} max={100} step={1} value={state.spo2} onChange={set('spo2')} placeholder="98" error={fieldErrors.spo2} />
        <Input label={t('weightKg', 'Weight (kg)')} type="number" min={0} max={500} step="0.1" value={state.weightKg} onChange={set('weightKg')} placeholder="70" error={fieldErrors.weightKg} />
        <Input label={t('heightCm', 'Height (cm)')} type="number" min={0} max={300} step="0.1" value={state.heightCm} onChange={set('heightCm')} placeholder="170" error={fieldErrors.heightCm} />
        <Input label={t('painScore', 'Pain (0-10)')} type="number" min={0} max={10} step={1} value={state.painScore} onChange={set('painScore')} placeholder="0" error={fieldErrors.painScore} />
        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <label className="block text-xs font-bold uppercase text-surface-500 mb-1">{t('notes', 'Notes')}</label>
          <textarea
            value={state.notes}
            onChange={(e) => setState((p) => ({ ...p, notes: e.target.value }))}
            className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
        </div>
        {errMsg && (
          <div className="col-span-full text-sm text-red-600">{errMsg}</div>
        )}
        {error && !errMsg && (
          <div className="col-span-full text-sm text-red-600">{t('vitalsSaveFailed', 'Failed to save vitals')}</div>
        )}
        <div className="col-span-full flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            <Save size={16} className="mr-2" /> {t('save', 'Save')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
