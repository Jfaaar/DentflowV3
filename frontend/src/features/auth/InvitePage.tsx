import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Loader2, CheckCircle, XCircle, Mail, Lock, UserRound } from 'lucide-react';
import { API_BASE_URL as API_URL } from '../../lib/apiBase';
import { useLanguage } from '../language/LanguageContext';
import { AuthShell } from './AuthShell';

interface InviteData {
  email: string;
  role: string;
  clinic_name: string;
}

export const InvitePage: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setError(t('invalidInvitationLink'));
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/invitations/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInviteData(data);
        }
      })
      .catch(() => setError(t('validateInvitationFailed')))
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t('acceptInvitationFailed'));
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 size={36} className="animate-spin text-primary-600" />
          <p className="mt-4 text-sm text-surface-500 dark:text-surface-400">
            {t('signingInEllipsis')}
          </p>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center mb-5 shadow-glow-accent">
            <CheckCircle size={36} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-surface-900 dark:text-white mb-2">
            {t('welcomeToClinic').replace('{clinic}', inviteData?.clinic_name || '')}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
            {t('accountCreatedSuccess')}
          </p>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => (window.location.href = '/')}
          >
            {t('goToLogin')}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (error && !inviteData) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 flex items-center justify-center mb-5">
            <XCircle size={36} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-surface-900 dark:text-white mb-2">
            {t('invalidInvitation')}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{error}</p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => (window.location.href = '/')}
          >
            {t('goToHomepage')}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight text-surface-900 dark:text-white mb-2">
          {t('joinClinic').replace('{clinic}', inviteData?.clinic_name || '')}
        </h1>
        <div className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
          <span>{t('invitedAs')}</span>
          <Badge tone="primary" dot>
            {inviteData?.role}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          floatingLabel
          iconPrefix={UserRound}
          label={t('yourName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          floatingLabel
          iconPrefix={Mail}
          label={t('emailAddress')}
          type="email"
          value={inviteData?.email || ''}
          disabled
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
        <Input
          floatingLabel
          iconPrefix={Lock}
          label={t('confirmPassword')}
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-slide-up">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          isLoading={submitting}
        >
          {submitting ? t('creatingAccountEllipsis') : t('createAccountAndJoin')}
        </Button>
      </form>
    </AuthShell>
  );
};
