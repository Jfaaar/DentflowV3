/**
 * Email Auth Provider - Supabase Implementation
 * Handles magic link and password-based email authentication
 */

import { supabase } from '../supabase';
import { EmailAuthProvider, AuthResult } from './authTypes';

export const emailAuthProvider: EmailAuthProvider = {
    /**
     * Send a magic link to the user's email
     */
    async sendMagicLink(email: string, redirectTo?: string): Promise<AuthResult> {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo || window.location.origin
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, email };
        } catch (err: any) {
            return { success: false, error: err.message || 'Failed to send magic link' };
        }
    },

    /**
     * Sign in with email and password
     */
    async signInWithPassword(email: string, password: string): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                userId: data.user?.id,
                email: data.user?.email || undefined
            };
        } catch (err: any) {
            return { success: false, error: err.message || 'Login failed' };
        }
    },

    /**
     * Sign up with email and password
     */
    async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                userId: data.user?.id,
                email: data.user?.email || undefined,
                needsProfileSetup: !data.user?.user_metadata?.name
            };
        } catch (err: any) {
            return { success: false, error: err.message || 'Registration failed' };
        }
    }
};
