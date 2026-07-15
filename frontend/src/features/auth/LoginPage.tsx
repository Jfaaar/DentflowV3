import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertCircle, Lock, UserRound } from 'lucide-react';
import { useAuth } from './useAuth';
import { useLanguage } from '../language/LanguageContext';
import { AuthShell } from './AuthShell';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email: username, password });
  };

  const fillDemo = () => {
    setUsername('demo');
    setPassword('demo');
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
          {t('welcomeBackShort')}
        </h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
          {t('signInToContinue')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          floatingLabel
          iconPrefix={UserRound}
          label={t('user')}
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          floatingLabel
          iconPrefix={Lock}
          label={t('password')}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2 animate-slide-up">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          {isLoading ? t('signingInEllipsis') : t('login')}
        </Button>
      </form>

      {/* Demo helper */}
      <div className="mt-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/40">
        <div className="text-xs text-surface-500 dark:text-surface-400">
          <span className="font-medium text-surface-700 dark:text-surface-300">{t('demoCreds')}</span>
          {' · '}
          <code className="font-mono text-primary-600 dark:text-primary-400">demo / demo</code>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {t('user')} →
        </button>
      </div>
    </AuthShell>
  );
};
