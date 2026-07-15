import React from 'react';
import { Activity, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  useListVitalsQuery,
  useDeleteVitalMutation,
  type VitalSigns,
} from './api/medicalApi';

interface Props {
  patientId: string;
}

function formatBp(v: VitalSigns): string {
  if (v.systolicBp == null && v.diastolicBp == null) return '—';
  return `${v.systolicBp ?? '?'}/${v.diastolicBp ?? '?'}`;
}

function formatNum(n: number | undefined, suffix = ''): string {
  return n != null ? `${n}${suffix}` : '—';
}

export const VitalsTimeline: React.FC<Props> = ({ patientId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useListVitalsQuery({ patientId, pageSize: 100 });
  const [deleteVital] = useDeleteVitalMutation();

  if (isLoading) {
    return <Card className="text-sm text-surface-500">{t('loading', 'Loading…')}</Card>;
  }
  const rows = data?.data ?? [];
  if (rows.length === 0) {
    return (
      <Card className="text-sm text-surface-500 italic flex items-center gap-2">
        <Activity size={16} /> {t('vitalsEmpty', 'No vital signs recorded yet.')}
      </Card>
    );
  }

  return (
    <Card noPadding>
      <table className="w-full text-sm">
        <thead className="bg-surface-50 dark:bg-surface-900/50 text-xs uppercase text-surface-500">
          <tr>
            <th className="text-left p-3">{t('date', 'Date')}</th>
            <th className="text-left p-3">{t('bp', 'BP')}</th>
            <th className="text-left p-3">{t('hr', 'HR')}</th>
            <th className="text-left p-3">{t('temperatureC', 'Temp °C')}</th>
            <th className="text-left p-3">{t('spo2', 'SpO₂')}</th>
            <th className="text-left p-3">{t('weight', 'Weight')}</th>
            <th className="text-left p-3">{t('bmi', 'BMI')}</th>
            <th className="text-left p-3">{t('pain', 'Pain')}</th>
            <th className="text-right p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-t border-surface-200 dark:border-surface-700">
              <td className="p-3 whitespace-nowrap">
                {new Date(v.recordedAt).toLocaleString()}
              </td>
              <td className="p-3">{formatBp(v)}</td>
              <td className="p-3">{formatNum(v.heartRate)}</td>
              <td className="p-3">{formatNum(v.temperatureC)}</td>
              <td className="p-3">{formatNum(v.spo2, '%')}</td>
              <td className="p-3">{formatNum(v.weightKg, ' kg')}</td>
              <td className="p-3">{formatNum(v.bmi)}</td>
              <td className="p-3">{formatNum(v.painScore)}</td>
              <td className="p-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t('confirmDelete', 'Delete this entry?'))) {
                      deleteVital(v.id);
                    }
                  }}
                  aria-label={t('delete', 'Delete')}
                >
                  <Trash2 size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};
