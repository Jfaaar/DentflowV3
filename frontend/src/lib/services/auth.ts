// Auth service — Supabase removed. The frontend now uses a localStorage-only
// demo session (see features/auth/useAuth.tsx). When you wire a real auth
// provider, replace this module.

export interface AppUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';
  clinicId?: string;
  avatar?: string;
}

const TOKEN_KEY = 'medineeo_access_token';
const USER_KEY = 'medineeo_user';

function readUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export const authService = {
  async getSession(): Promise<{ access_token: string; user: AppUser } | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = readUser();
    if (!token || !user) return null;
    return { access_token: token, user };
  },

  async getCurrentUser(): Promise<AppUser | null> {
    return readUser();
  },

  async signOut(): Promise<void> {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* localStorage unavailable */
    }
  },

  onAuthStateChange(_callback: (event: string, session: unknown) => void) {
    // No-op until a real auth provider is wired in.
    return { unsubscribe: () => {} };
  },
};
