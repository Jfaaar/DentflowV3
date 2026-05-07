import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from './useAuth';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email: username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-surface-100 shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-600 p-3 rounded-2xl text-white mb-4 shadow-lg shadow-primary-200/50">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
          <p className="text-surface-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="User"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="demo"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo"
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
            {isLoading ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-surface-400">
          Demo: <code className="font-mono">demo</code> / <code className="font-mono">demo</code>
        </p>
      </Card>
    </div>
  );
};
