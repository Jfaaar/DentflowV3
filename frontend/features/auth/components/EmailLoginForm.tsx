import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../../../lib/services/auth';

interface EmailLoginFormProps {
    onSuccess?: () => void;
    onSwitchToPassword?: () => void;
}

export const EmailLoginForm: React.FC<EmailLoginFormProps> = ({
    onSuccess,
    onSwitchToPassword
}) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await authService.email.sendMagicLink(email);

        setIsLoading(false);

        if (result.success) {
            setSent(true);
            onSuccess?.();
        } else {
            setError(result.error || 'Failed to send magic link');
        }
    };

    if (sent) {
        return (
            <div className="text-center py-8 animate-in fade-in duration-300">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">Check your inbox!</h3>
                <p className="text-surface-600 text-sm mb-4">
                    We sent a magic link to<br />
                    <span className="font-medium text-surface-900">{email}</span>
                </p>
                <p className="text-surface-500 text-xs">
                    Click the link in the email to sign in.
                </p>
                <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="mt-6 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Use a different email
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div className="relative">
                <Input
                    label="Email address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                />
                <Mail className="absolute left-3 top-9 text-surface-400" size={18} />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <Button
                type="submit"
                className="w-full py-3 text-base shadow-lg shadow-primary-200"
                disabled={isLoading || !email}
            >
                {isLoading ? 'Sending...' : 'Send Magic Link'}
            </Button>

            {onSwitchToPassword && (
                <button
                    type="button"
                    onClick={onSwitchToPassword}
                    className="w-full text-sm text-surface-500 hover:text-primary-600 mt-2"
                >
                    Sign in with password instead
                </button>
            )}
        </form>
    );
};
