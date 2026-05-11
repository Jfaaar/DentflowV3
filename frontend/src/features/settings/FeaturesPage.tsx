// Features admin page — toggle per-clinic feature overrides on top of the
// specialty-driven defaults seeded in feature_definitions.
//
// Each feature row shows:
//   • the canonical name + category badge
//   • the default state derived from clinic.enabled_specialties (greyed if auto)
//   • a switch for the manual override
//   • a "reset to default" button when the row is overridden
//
// All admin-only writes go through PUT/DELETE /api/v1/features/:key.
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Sparkles, ShieldCheck, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useGetFeaturesQuery,
  useSetFeatureOverrideMutation,
  useClearFeatureOverrideMutation,
} from './api/featuresApi';
import { useAuth } from '../auth/useAuth';
import type { FeatureState } from '@/lib/features';

const CATEGORY_META: Record<FeatureState['category'], { icon: React.ReactNode; label: string; chip: string }> = {
  clinical: {
    icon: <Sparkles size={14} />,
    label: 'Clinical',
    chip: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
  },
  operations: {
    icon: <Wrench size={14} />,
    label: 'Operations',
    chip: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-200',
  },
  admin: {
    icon: <ShieldCheck size={14} />,
    label: 'Admin',
    chip: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200',
  },
};

const Toggle: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({
  checked,
  onChange,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
      checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      aria-hidden
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const FeaturesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'clinic_admin' || user?.role === 'super_admin';

  const { data, isLoading } = useGetFeaturesQuery();
  const [setOverride] = useSetFeatureOverrideMutation();
  const [clearOverride] = useClearFeatureOverrideMutation();

  const byCategory = useMemo(() => {
    const groups: Record<FeatureState['category'], FeatureState[]> = {
      clinical: [],
      operations: [],
      admin: [],
    };
    for (const f of data ?? []) groups[f.category].push(f);
    return groups;
  }, [data]);

  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-surface-500">
        {t('featuresPermissionDenied', 'You do not have permission to manage clinic features.')}
      </div>
    );
  }

  const renderRow = (f: FeatureState) => {
    const isOverride = f.source === 'override';
    return (
      <div
        key={f.featureKey}
        className="flex items-center gap-4 py-3 border-b last:border-b-0 border-surface-100 dark:border-surface-800"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-surface-900 dark:text-white">{f.displayName}</span>
            {isOverride && (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                {t('featuresOverride', 'override')}
              </span>
            )}
            {!isOverride && !f.autoEnabled && (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                {t('featuresAutoOff', 'specialty off')}
              </span>
            )}
            <code className="text-[11px] text-surface-400">{f.featureKey}</code>
          </div>
          {f.description && (
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{f.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearOverride(f.featureKey)}
              title={t('featuresResetTitle', 'Reset to specialty default') as string}
            >
              <RotateCcw size={14} />
            </Button>
          )}
          <Toggle
            checked={f.enabled}
            onChange={() =>
              setOverride({ featureKey: f.featureKey, enabled: !f.enabled })
            }
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {t('featuresTitle', 'Features')}
        </h1>
        <p className="text-surface-500">
          {t(
            'featuresDescription',
            'Enable or disable modules for this clinic. By default each feature follows the clinic specialties; toggling here pins the feature on or off until you reset it.',
          )}
        </p>
      </header>

      {isLoading && (
        <div className="text-sm text-surface-500">{t('loading', 'Loading…')}</div>
      )}

      {(Object.keys(byCategory) as FeatureState['category'][]).map((cat) => {
        const items = byCategory[cat];
        if (!items.length) return null;
        const meta = CATEGORY_META[cat];
        return (
          <Card key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.chip}`}>
                {meta.icon}
                {t(`featuresCategory_${cat}`, meta.label)}
              </span>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {items.map(renderRow)}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
