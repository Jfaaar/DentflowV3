import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Activity, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from './useAuth';
import { useLanguage } from '../language/LanguageContext';

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
            setLocalError(error.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4 animate-in fade-in duration-500">
            <Card className="w-full max-w-md border-surface-100 shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary-600 p-3 rounded-2xl text-white mb-4 shadow-lg shadow-primary-200/50">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900">Create Account</h1>
                    <p className="text-surface-500 text-sm mt-1">Join the DentFlow team</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. John Doe"
                    />

                    <Input
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                    />

                    <Input
                        label="Password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
                        <select
                            title="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full rounded-xl border-surface-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 bg-white text-surface-900 transition-all duration-200 ease-in-out"
                        >
                            <option value="doctor">Doctor</option>
                            <option value="assistant">Assistant</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {localError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{localError}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full py-3 text-base shadow-lg shadow-primary-200 mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </Button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={onBackToLogin}
                            className="text-sm text-surface-500 hover:text-primary-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to Login
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
