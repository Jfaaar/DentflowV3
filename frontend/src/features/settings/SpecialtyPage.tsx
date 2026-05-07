import React, { useEffect, useState } from 'react';
import { Stethoscope, Save, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import {
  SPECIALTY_CODES,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type SpecialtyCode,
} from './api/settingsApi';
import { useAuth } from '../auth/useAuth';

const SPECIALTY_LABEL_KEYS: Record<SpecialtyCode, string> = {
  general_practice: 'specialtyGeneralPractice',
  dental: 'specialtyDental',
  pediatrics: 'specialtyPediatrics',
  gynecology: 'specialtyGynecology',
  cardiology: 'specialtyCardiology',
  dermatology: 'specialtyDermatology',
  ent: 'specialtyEnt',
  ophthalmology: 'specialtyOphthalmology',
  orthopedics: 'specialtyOrthopedics',
  psychiatry: 'specialtyPsychiatry',
  other: 'specialtyOther',
};

export const SpecialtyPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [primary, setPrimary] = useState<SpecialtyCode>('general_practice');
  const [enabled, setEnabled] = useState<SpecialtyCode[]>(['general_practice']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setPrimary(data.primarySpecialty);
      setEnabled(data.enabledSpecialties);
    }
  }, [data]);

  if (user?.role !== 'clinic_admin') {
    return (
      <div className="p-10 text-center text-surface-500">
        {t('specialtyPermissionDenied', 'You do not have permission to manage clinic specialties.')}
      </div>
    );
  }

  const toggleEnabled = (code: SpecialtyCode) => {
    setEnabled((prev) => {
      if (prev.includes(code)) {
        // Don't allow deselecting the primary specialty.
        if (code === primary) return prev;
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handlePrimaryChange = (code: SpecialtyCode) => {
    setPrimary(code);
    if (!enabled.includes(code)) setEnabled((prev) => [...prev, code]);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    try {
      await updateSettings({ primarySpecialty: primary, enabledSpecialties: enabled }).unwrap();
    } catch (e: unknown) {
      const msg = (e as { data?: { error?: { message?: string } } })?.data?.error?.message;
      setErrorMsg(msg ?? t('specialtySaveFailed', 'Failed to save specialty settings'));
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {t('specialtyTitle', 'Clinic specialties')}
          </h1>
          <p className="text-surface-500">
            {t(
              'specialtyDescription',
              'Configure which specialties this clinic provides. Specialty-specific features (dental chart, body chart, etc.) appear based on this selection.',
            )}
          </p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} disabled={isLoading || isSaving}>
          <Save size={18} className="mr-2" />
          {t('save', 'Save')}
        </Button>
      </header>

      {errorMsg && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600">
            <Stethoscope size={20} />
          </div>
          <h2 className="text-lg font-semibold">
            {t('specialtyPrimary', 'Primary specialty')}
          </h2>
        </div>
        <p className="text-sm text-surface-500 mb-4">
          {t(
            'specialtyPrimaryDescription',
            'The default specialty for this clinic. Drives the layout of new patient records.',
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPECIALTY_CODES.map((code) => (
            <label
              key={code}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                primary === code
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
                  : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
              }`}
            >
              <input
                type="radio"
                name="primary-specialty"
                checked={primary === code}
                onChange={() => handlePrimaryChange(code)}
                className="sr-only"
              />
              <span className="text-sm">{t(SPECIALTY_LABEL_KEYS[code], code)}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">
          {t('specialtyEnabled', 'Enabled specialties')}
        </h2>
        <p className="text-sm text-surface-500 mb-4">
          {t(
            'specialtyEnabledDescription',
            'Select every specialty this clinic offers. Patients can be tagged with any enabled specialty and the matching UI surfaces will appear.',
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPECIALTY_CODES.map((code) => {
            const checked = enabled.includes(code);
            const isPrimary = code === primary;
            return (
              <label
                key={code}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  checked
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700'
                } ${isPrimary ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isPrimary}
                  onChange={() => toggleEnabled(code)}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{t(SPECIALTY_LABEL_KEYS[code], code)}</span>
                {isPrimary && (
                  <span className="ml-auto text-xs text-primary-600 dark:text-primary-300">
                    {t('specialtyPrimaryBadge', 'primary')}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
