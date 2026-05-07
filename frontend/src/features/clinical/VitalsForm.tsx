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

export const VitalsForm: React.FC<Props> = ({ patientId, onSaved }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(blank);
  const [createVital, { isLoading, error }] = useCreateVitalMutation();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
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
      const msg = (e as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setErrMsg(msg ?? t('vitalsSaveFailed', 'Failed to save vitals'));
    }
  };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setState((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600">
          <Activity size={20} />
        </div>
        <h3 className="text-lg font-semibold">{t('vitalsRecord', 'Record vitals')}</h3>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Input label={t('systolicBp', 'Systolic BP')} type="number" value={state.systolicBp} onChange={set('systolicBp')} placeholder="120" />
        <Input label={t('diastolicBp', 'Diastolic BP')} type="number" value={state.diastolicBp} onChange={set('diastolicBp')} placeholder="80" />
        <Input label={t('heartRate', 'Heart rate')} type="number" value={state.heartRate} onChange={set('heartRate')} placeholder="72" />
        <Input label={t('temperatureC', 'Temperature (°C)')} type="number" step="0.1" value={state.temperatureC} onChange={set('temperatureC')} placeholder="36.6" />
        <Input label={t('respiratoryRate', 'Respiratory rate')} type="number" value={state.respiratoryRate} onChange={set('respiratoryRate')} placeholder="16" />
        <Input label={t('spo2', 'SpO₂ (%)')} type="number" value={state.spo2} onChange={set('spo2')} placeholder="98" />
        <Input label={t('weightKg', 'Weight (kg)')} type="number" step="0.1" value={state.weightKg} onChange={set('weightKg')} placeholder="70" />
        <Input label={t('heightCm', 'Height (cm)')} type="number" step="0.1" value={state.heightCm} onChange={set('heightCm')} placeholder="170" />
        <Input label={t('painScore', 'Pain (0-10)')} type="number" min={0} max={10} value={state.painScore} onChange={set('painScore')} placeholder="0" />
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
