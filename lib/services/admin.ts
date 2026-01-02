/**
 * Admin Service - Handles admin operations via Express API
 * This abstraction allows swapping the backend later
 */

import { supabase } from '../supabase';

const API_URL = 'http://localhost:3001';

// Get Supabase access token for authenticated API calls
const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
};

export interface Customer {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    last_sign_in?: string;
    provider?: string;
}

export const adminService = {
    /**
     * Create a new customer/user
     */
    createUser: async (email: string, name?: string, role?: string): Promise<Customer> => {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/admin/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, name, role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create user');
        return data;
    },

    /**
     * List all customers/users
     */
    listUsers: async (): Promise<Customer[]> => {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/admin/customers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to fetch users');
        }
        return response.json();
    },

    /**
     * Delete a customer/user
     */
    deleteUser: async (id: string): Promise<void> => {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/admin/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete user');
        }
    }
};
