import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  UserRound,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from './useAuth';
import { useLanguage } from '../language/LanguageContext';
import { AuthShell } from './AuthShell';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin }) => {
  const { register, isLoading } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'assistant' | 'admin'>('doctor');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await register({ name, email, password, role });
    } catch (error: any) {
      setLocalError(error.message || t('registrationFailed'));
    }
  };

  return (
    <AuthShell>
      <div className="text-center mb-7">
        <h1 className="font-display text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
          {t('createAccount')}
        </h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">{t('joinTeam')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          floatingLabel
          iconPrefix={UserRound}
          label={t('fullName')}
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          floatingLabel
          iconPrefix={Mail}
          label={t('emailAddress')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          floatingLabel
          iconPrefix={Lock}
          label={t('password')}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="relative">
          <Stethoscope
            size={18}
            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none"
            aria-hidden
          />
          <select
            title={t('role')}
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="h-12 w-full ps-10 pe-4 rounded-xl border border-surface-300 dark:border-surface-700 bg-white/80 dark:bg-surface-900/60 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:border-primary-500 focus:shadow-glow transition-all"
          >
            <option value="doctor">{t('roleDoctor')}</option>
            <option value="assistant">{t('roleAssistant')}</option>
            <option value="admin">{t('roleAdmin')}</option>
          </select>
        </div>

        {localError && (
          <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2 animate-slide-up">
            <AlertCircle size={16} className="shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full mt-1"
          isLoading={isLoading}
        >
          {isLoading ? t('creatingAccountEllipsis') : t('register')}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-300 inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> {t('backToLogin')}
        </button>
      </form>
    </AuthShell>
  );
};
