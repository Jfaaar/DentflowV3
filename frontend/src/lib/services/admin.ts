// Admin service — backend admin endpoints are stubbed (501) until a new
// auth provider is wired in. The shape is preserved so callsites compile;
// each call rejects with an "auth provider not configured" error at runtime.

export interface Customer {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_sign_in?: string;
  provider?: string;
}

const NOT_IMPLEMENTED = () =>
  Promise.reject(new Error('Admin endpoints need a new auth provider; see backend/routes/backoffice.js'));

// Variadic signatures so legacy callsites compile; rejection happens at call time.
export const adminService = {
  createUser: (..._args: unknown[]): Promise<Customer> => NOT_IMPLEMENTED(),
  listUsers: (..._args: unknown[]): Promise<Customer[]> => NOT_IMPLEMENTED(),
  deleteUser: (..._args: unknown[]): Promise<void> => NOT_IMPLEMENTED(),
};
