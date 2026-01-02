import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../../../lib/services/auth';
import { OTPInput } from './OTPInput';

interface PhoneLoginFormProps {
    onSuccess?: (userId: string, needsProfileSetup: boolean, phone?: string) => void;
}

type Step = 'phone' | 'otp';

// Common country codes
const countryCodes = [
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
];

export const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onSuccess }) => {
    const [step, setStep] = useState<Step>('phone');
    const [countryCode, setCountryCode] = useState('+212');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullPhoneNumber, setFullPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recaptchaReady, setRecaptchaReady] = useState(false);

    // Initialize reCAPTCHA on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                authService.phone.initRecaptcha('recaptcha-container');
                setRecaptchaReady(true);
            } catch (err) {
                console.error('Failed to init reCAPTCHA:', err);
                setError('Failed to initialize verification. Please refresh the page.');
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            authService.phone.clearRecaptcha();
        };
    }, []);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Clean phone number: remove spaces, dashes, parentheses
        const cleanedPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

        // Validate phone number (should be 6-15 digits)
        if (!/^\d{6,15}$/.test(cleanedPhone)) {
            setError('Please enter a valid phone number (6-15 digits, without country code)');
            setIsLoading(false);
            return;
        }

        // Format as E.164: +[country code][phone number]
        const formattedPhone = `${countryCode}${cleanedPhone}`;
        setFullPhoneNumber(formattedPhone);

        console.log('Sending OTP to:', formattedPhone);

        const result = await authService.phone.sendOTP(formattedPhone);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setVerificationId(result.verificationId);
            setStep('otp');
        }
    };

    const handleVerifyOTP = async (code: string) => {
        setIsLoading(true);
        setError(null);

        const result = await authService.phone.verifyOTP(verificationId, code);

        setIsLoading(false);

        if (result.success) {
            onSuccess?.(result.userId!, result.needsProfileSetup || false, fullPhoneNumber);
        } else {
            setError(result.error || 'Verification failed');
        }
    };

    const handleBack = () => {
        setStep('phone');
        setError(null);
    };

    if (step === 'otp') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="text-center">
                    <h3 className="text-lg font-semibold text-surface-900 mb-2">Enter verification code</h3>
                    <p className="text-surface-600 text-sm">
                        We sent a 6-digit code to<br />
                        <span className="font-medium text-surface-900">{fullPhoneNumber}</span>
                    </p>
                </div>

                <OTPInput onComplete={handleVerifyOTP} disabled={isLoading} />

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {isLoading && (
                    <p className="text-center text-sm text-surface-500">Verifying...</p>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Phone number</label>
                <div className="flex gap-2">
                    {/* Country code selector */}
                    <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-32 rounded-xl border-surface-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 bg-white text-surface-900"
                        title="Country code"
                    >
                        {countryCodes.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.flag} {c.code}
                            </option>
                        ))}
                    </select>

                    {/* Phone number input */}
                    <div className="relative flex-1">
                        <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="612345678"
                            className="w-full rounded-xl border border-surface-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 pl-10 pr-3 bg-white text-surface-900"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                    </div>
                </div>
            </div>

            <p className="text-xs text-surface-500">
                Enter your phone number without the country code (we'll add it automatically)
            </p>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* reCAPTCHA container - invisible mode attaches to button */}
            <div id="recaptcha-container" />

            <Button
                type="submit"
                className="w-full py-3 text-base shadow-lg shadow-primary-200"
                disabled={isLoading || !phoneNumber || !recaptchaReady}
            >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
        </form>
    );
};
