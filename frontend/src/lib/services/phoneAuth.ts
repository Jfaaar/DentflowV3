/**
 * Phone Auth Provider - Firebase Implementation
 * Handles phone OTP authentication via Firebase
 */

import { firebaseAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../firebase';
import { PhoneAuthProvider, AuthResult } from './authTypes';
import { supabase } from '../supabase';

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const phoneAuthProvider: PhoneAuthProvider = {
    /**
     * Initialize reCAPTCHA verifier
     */
    initRecaptcha(containerId: string): void {
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
        }

        recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
            size: 'invisible',
            callback: () => {
                // reCAPTCHA solved - invisible mode auto-resolves
                console.log('reCAPTCHA verified (invisible)');
            },
            'expired-callback': () => {
                // Reset reCAPTCHA
                console.log('reCAPTCHA expired');
            }
        });

        // For invisible reCAPTCHA, render returns a promise
        recaptchaVerifier.render().catch((err: Error) => {
            console.warn('reCAPTCHA render warning:', err.message);
        });
    },

    /**
     * Send OTP to phone number
     */
    async sendOTP(phoneNumber: string): Promise<{ verificationId: string; error?: string }> {
        if (!recaptchaVerifier) {
            return { verificationId: '', error: 'reCAPTCHA not initialized' };
        }

        try {
            console.log('Starting signInWithPhoneNumber...');

            // Add timeout to prevent hanging indefinitely
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Phone verification timed out after 30 seconds')), 30000);
            });

            confirmationResult = await Promise.race([
                signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier),
                timeoutPromise
            ]);

            console.log('signInWithPhoneNumber succeeded, verificationId:', confirmationResult.verificationId);
            return { verificationId: confirmationResult.verificationId };
        } catch (err: any) {
            console.error('Phone OTP error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);

            // Reset reCAPTCHA on error so user can retry
            if (recaptchaVerifier) {
                try {
                    recaptchaVerifier.clear();
                    recaptchaVerifier = null;
                } catch (clearErr) {
                    console.warn('Failed to clear reCAPTCHA:', clearErr);
                }
            }

            return {
                verificationId: '',
                error: err.message || 'Failed to send OTP'
            };
        }
    },

    /**
     * Verify OTP code
     */
    async verifyOTP(verificationId: string, code: string): Promise<AuthResult> {
        if (!confirmationResult) {
            return { success: false, error: 'No verification in progress' };
        }

        try {
            const result = await confirmationResult.confirm(code);
            const firebaseUser = result.user;

            if (!firebaseUser) {
                return { success: false, error: 'Verification failed' };
            }

            // Get Firebase ID token to verify on backend
            const idToken = await firebaseUser.getIdToken();

            // Link with Supabase - create/update profile
            // We'll use a custom approach: sign in anonymously or with a service role
            // For now, we store the phone auth state and check profiles

            // Check if a Supabase profile exists with this phone number
            const phoneNumber = firebaseUser.phoneNumber;

            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, name, role, clinic_id')
                .eq('phone', phoneNumber)
                .single();

            return {
                success: true,
                userId: existingProfile?.id || firebaseUser.uid,
                phone: phoneNumber || undefined,
                needsProfileSetup: !existingProfile
            };
        } catch (err: any) {
            console.error('OTP verification error:', err);
            return {
                success: false,
                error: err.code === 'auth/invalid-verification-code'
                    ? 'Invalid verification code'
                    : err.message || 'Verification failed'
            };
        }
    },

    /**
     * Clean up reCAPTCHA
     */
    clearRecaptcha(): void {
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }
        confirmationResult = null;
    }
};
