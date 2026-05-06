/**
 * Auth Service - Unified authentication interface
 * Combines Email (Supabase) and Phone (Firebase) authentication
 */

import { supabase } from '../supabase';
import { emailAuthProvider } from './emailAuth';
import { phoneAuthProvider } from './phoneAuth';
import { AuthService, AppUser } from './authTypes';

export type { AppUser };

export const authService: AuthService = {
    email: emailAuthProvider,
    phone: phoneAuthProvider,

    /**
     * Get current session
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * Get current user with profile
     */
    async getCurrentUser(): Promise<AppUser | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('name, role, clinic_id, avatar, phone')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email,
            phone: profile?.phone,
            name: profile?.name || user.email || 'User',
            role: profile?.role || 'assistant',
            clinicId: profile?.clinic_id,
            avatar: profile?.avatar
        };
    },

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        return { unsubscribe: () => subscription.unsubscribe() };
    }
};

// Re-export for backward compatibility
export { emailAuthProvider, phoneAuthProvider };
