import React, { useState } from 'react';
import { Syringe, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  useListVaccinationsQuery,
  useCreateVaccinationMutation,
  useDeleteVaccinationMutation,
} from './api/medicalApi';

interface Props {
  patientId: string;
}

interface FormState {
  vaccineName: string;
  administeredDate: string;
  doseNumber: string;
  lotNumber: string;
  manufacturer: string;
  site: string;
  route: string;
  nextDoseDate: string;
  notes: string;
}

const blank: FormState = {
  vaccineName: '',
  administeredDate: new Date().toISOString().slice(0, 10),
  doseNumber: '',
  lotNumber: '',
  manufacturer: '',
  site: '',
  route: '',
  nextDoseDate: '',
  notes: '',
};

export const VaccinationsList: React.FC<Props> = ({ patientId }) => {
  const { t } = useTranslation();
  const { data } = useListVaccinationsQuery({ patientId, pageSize: 100 });
  const [createVaccination, { isLoading: isCreating }] = useCreateVaccinationMutation();
  const [deleteVaccination] = useDeleteVaccinationMutation();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(blank);

  const reset = () => {
    setAdding(false);
    setForm(blank);
  };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.vaccineName || !form.administeredDate) return;
    await createVaccination({
      patientId,
      vaccineName: form.vaccineName,
      administeredDate: form.administeredDate,
      doseNumber: form.doseNumber ? Number(form.doseNumber) : undefined,
      lotNumber: form.lotNumber || undefined,
      manufacturer: form.manufacturer || undefined,
      site: form.site || undefined,
      route: form.route || undefined,
      nextDoseDate: form.nextDoseDate || undefined,
      notes: form.notes || undefined,
    }).unwrap();
    reset();
  };

  const today = new Date().toISOString().slice(0, 10);
  const list = data?.data ?? [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600">
            <Syringe size={20} />
          </div>
          <h3 className="text-lg font-semibold">{t('vaccinations', 'Vaccinations')}</h3>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} className="mr-1" /> {t('addVaccination', 'Add vaccination')}
          </Button>
        )}
      </div>

      {adding && (
        <div className="space-y-3 p-4 mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('vaccineName', 'Vaccine name')} value={form.vaccineName} onChange={set('vaccineName')} required />
            <Input label={t('administeredDate', 'Administered on')} type="date" value={form.administeredDate} onChange={set('administeredDate')} required />
            <Input label={t('doseNumber', 'Dose #')} type="number" min={1} value={form.doseNumber} onChange={set('doseNumber')} />
            <Input label={t('manufacturer', 'Manufacturer')} value={form.manufacturer} onChange={set('manufacturer')} />
            <Input label={t('lotNumber', 'Lot #')} value={form.lotNumber} onChange={set('lotNumber')} />
            <Input label={t('route', 'Route')} value={form.route} onChange={set('route')} placeholder="IM / SC / oral" />
            <Input label={t('site', 'Site')} value={form.site} onChange={set('site')} placeholder="left deltoid" />
            <Input label={t('nextDoseDate', 'Next dose')} type="date" value={form.nextDoseDate} onChange={set('nextDoseDate')} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-surface-500 mb-1">{t('notes', 'Notes')}</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>{t('cancel', 'Cancel')}</Button>
            <Button onClick={handleAdd} isLoading={isCreating} disabled={!form.vaccineName || !form.administeredDate}>
              {t('save', 'Save')}
            </Button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-surface-500 italic">{t('vaccinationsEmpty', 'No vaccinations recorded.')}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((v) => {
            const isDue = v.nextDoseDate && v.nextDoseDate <= today;
            return (
              <li
                key={v.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{v.vaccineName}</span>
                    {v.doseNumber != null && (
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                        {t('doseAbbrev', 'Dose')} #{v.doseNumber}
                      </span>
                    )}
                    {isDue && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                        <AlertCircle size={12} /> {t('vaccinationDue', 'Due')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    {v.administeredDate}
                    {v.manufacturer ? ` · ${v.manufacturer}` : ''}
                    {v.route ? ` · ${v.route}` : ''}
                    {v.site ? ` · ${v.site}` : ''}
                  </p>
                  {v.nextDoseDate && (
                    <p className="text-xs text-surface-500 mt-0.5">
                      {t('nextDose', 'Next dose')}: {v.nextDoseDate}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t('confirmDelete', 'Delete this entry?'))) deleteVaccination(v.id);
                  }}
                  aria-label={t('delete', 'Delete')}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
