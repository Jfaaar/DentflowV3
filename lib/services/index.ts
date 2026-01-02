/**
 * Services Layer - Abstraction for backend operations
 * 
 * This allows swapping implementations without changing component code:
 * - authService: Supabase Auth (can swap to Firebase, Auth0, etc.)
 * - adminService: Express API (can swap to Edge Functions, direct Supabase, etc.)
 */

export { authService, type User, type Session } from './auth';
export { adminService, type Customer } from './admin';
