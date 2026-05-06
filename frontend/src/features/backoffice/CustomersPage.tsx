import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Topbar } from '../../components/layout/Topbar';
import { UserPlus, Trash2, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { API_BASE_URL as API_URL } from '../../lib/apiBase';

interface Customer {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    last_sign_in?: string;
    provider?: string;
}

export const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'doctor' | 'assistant'>('doctor');

    const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    };

    const fetchCustomers = async () => {
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/api/admin/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to fetch customers');
            }

            const data = await response.json();
            setCustomers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
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

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create customer');
            }

            setCustomers(prev => [data, ...prev]);
            setEmail('');
            setName('');
            setRole('doctor');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/api/admin/customers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete customer');
            }

            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <>
            <Topbar title="Customer Management" />
            <div className="p-6 space-y-6 animate-in fade-in duration-500">
                <Card className="p-6 border-surface-200 dark:border-surface-700">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-primary-600" />
                        Add New Customer
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input label="Email" type="email" required value={email}
                                onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" />
                        </div>
                        <div className="flex-1">
                            <Input label="Name (optional)" type="text" value={name}
                                onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                        </div>
                        <div className="w-full md:w-40">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value as 'doctor' | 'assistant')}
                                className="w-full rounded-xl border-surface-200 dark:border-surface-600 shadow-sm py-2.5 px-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
                                <option value="doctor">Doctor</option>
                                <option value="assistant">Assistant</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                                {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Adding...</>
                                    : <><UserPlus size={16} className="mr-2" /> Add Customer</>}
                            </Button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </Card>

                <Card className="border-surface-200 dark:border-surface-700 overflow-hidden">
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                            Customers ({customers.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-surface-500">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                            Loading customers...
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-8 text-center text-surface-500">No customers yet. Add one above.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-50 dark:bg-surface-800 text-left">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Email</th>
                                        <th className="px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Name</th>
                                        <th className="px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Role</th>
                                        <th className="px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Created</th>
                                        <th className="px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Last Sign In</th>
                                        <th className="px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-surface-400" />
                                                    <span className="text-surface-900 dark:text-white">{customer.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{customer.name || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                    <Shield size={12} />{customer.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-surface-500 text-sm">
                                                <div className="flex items-center gap-1"><Calendar size={12} />{formatDate(customer.created_at)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-surface-500 text-sm">{formatDate(customer.last_sign_in)}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => handleDelete(customer.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete customer"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
};
