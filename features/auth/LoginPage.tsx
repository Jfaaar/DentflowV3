import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Activity, AlertCircle, Mail, Phone } from 'lucide-react';
import { useAuth } from './useAuth';
import { useLanguage } from '../language/LanguageContext';
import { EmailLoginForm } from './components/EmailLoginForm';
import { PhoneLoginForm } from './components/PhoneLoginForm';

interface LoginPageProps {
  onRegisterClick: () => void;
}

type AuthMethod = 'email' | 'phone' | 'password';

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick }) => {
  const { login, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  const handlePhoneSuccess = (userId: string, needsProfileSetup: boolean) => {
    // Phone auth successful - the auth state change will handle the rest
    console.log('Phone auth success:', userId, 'needs setup:', needsProfileSetup);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-surface-100 shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-600 p-3 rounded-2xl text-white mb-4 shadow-lg shadow-primary-200/50">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">{t('welcomeBack')}</h1>
          <p className="text-surface-500 text-sm mt-1">{t('signInSubtitle')}</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="flex mb-6 bg-surface-100 p-1 rounded-xl">
          <button
            onClick={() => setAuthMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${authMethod === 'email'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
              }`}
          >
            <Mail size={16} />
            Email
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${authMethod === 'phone'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
              }`}
          >
            <Phone size={16} />
            Phone
          </button>
        </div>

        {/* Email Magic Link Form */}
        {authMethod === 'email' && (
          <EmailLoginForm
            onSwitchToPassword={() => setAuthMethod('password')}
          />
        )}

        {/* Phone OTP Form */}
        {authMethod === 'phone' && (
          <PhoneLoginForm onSuccess={handlePhoneSuccess} />
        )}

        {/* Password Form (accessed from email form) */}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className="text-sm text-surface-500 hover:text-primary-600 mb-2"
            >
              ← Back to magic link
            </button>

            <Input
              label={t('usernameOrEmail')}
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label={t('password')}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-base shadow-lg shadow-primary-200"
              disabled={isLoading}
            >
              {isLoading ? t('signingIn') : t('signIn')}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onRegisterClick}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Don't have an account? Register
          </button>
        </div>
      </Card>
    </div>
  );
};