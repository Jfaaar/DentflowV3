import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL as API_URL } from '../../lib/apiBase';

interface InviteData {
    email: string;
    role: string;
    clinic_name: string;
}

export const InvitePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [inviteData, setInviteData] = useState<InviteData | null>(null);

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link');
            setLoading(false);
            return;
        }

        // Validate token
        fetch(`${API_URL}/api/invitations/${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setInviteData(data);
                }
            })
            .catch(() => setError('Failed to validate invitation'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/invitations/${token}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
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
            <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                        Welcome to {inviteData?.clinic_name}!
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mb-6">
                        Your account has been created successfully. You can now sign in.
                    </p>
                    <Button onClick={() => window.location.href = '/'} className="w-full">
                        Go to Login
                    </Button>
                </Card>
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                        Invalid Invitation
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mb-6">{error}</p>
                    <Button onClick={() => window.location.href = '/'} variant="secondary" className="w-full">
                        Go to Homepage
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                        <Building2 size={32} className="text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">
                        Join {inviteData?.clinic_name}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400">
                        You've been invited as a <span className="font-medium text-primary-600">{inviteData?.role}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. John Smith"
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={inviteData?.email || ''}
                        disabled
                        className="bg-surface-100 dark:bg-surface-700"
                    />
                    <Input
                        label="Password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                    />

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? (
                            <><Loader2 size={16} className="animate-spin mr-2" /> Creating Account...</>
                        ) : (
                            'Create Account & Join'
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
};
