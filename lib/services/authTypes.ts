/**
 * Auth Types - Abstraction layer for authentication providers
 * Allows switching between Supabase, Firebase, or other providers
 */

export interface AuthResult {
    success: boolean;
    userId?: string;
    email?: string;
    phone?: string;
    error?: string;
    needsProfileSetup?: boolean;
}

export interface EmailAuthProvider {
    /**
     * Send a magic link to the user's email
     */
    sendMagicLink(email: string, redirectTo?: string): Promise<AuthResult>;

    /**
     * Sign in with email and password
     */
    signInWithPassword(email: string, password: string): Promise<AuthResult>;

    /**
     * Sign up with email and password
     */
    signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResult>;
}

export interface PhoneAuthProvider {
    /**
     * Initialize reCAPTCHA verifier (required for Firebase phone auth)
     */
    initRecaptcha(containerId: string): void;

    /**
     * Send OTP to phone number
     */
    sendOTP(phoneNumber: string): Promise<{ verificationId: string; error?: string }>;

    /**
     * Verify OTP code
     */
    verifyOTP(verificationId: string, code: string): Promise<AuthResult>;

    /**
     * Clean up reCAPTCHA
     */
    clearRecaptcha(): void;
}

export interface AuthService {
    email: EmailAuthProvider;
    phone: PhoneAuthProvider;

    /**
     * Get current session
     */
    getSession(): Promise<any>;

    /**
     * Get current user with profile
     */
    getCurrentUser(): Promise<any>;

    /**
     * Sign out
     */
    signOut(): Promise<void>;

    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback: (event: string, session: any) => void): { unsubscribe: () => void };
}

// User type for the application
export interface AppUser {
    id: string;
    email?: string;
    phone?: string;
    name: string;
    role: 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';
    clinicId?: string;
    avatar?: string;
}
