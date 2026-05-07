import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { UserPlus, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/useAuth';

export const TeamPage: React.FC = () => {
    const { user } = useAuth();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'doctor' | 'assistant'>('assistant');

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.staff.create({ name, email, password, role });
            alert('Staff member added successfully!');
            setIsInviteOpen(false);
            // Reset
            setName(''); setEmail(''); setPassword('');
        } catch (e: any) {
            alert(e.message || 'Failed to add staff');
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.role !== 'clinic_admin') {
        return (
            <div className="p-10 text-center text-surface-500">
                You do not have permission to manage the team.
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Team Management</h1>
                    <p className="text-surface-500">Manage your clinic staff and access</p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)}>
                    <UserPlus size={20} className="mr-2" />
                    Add Staff Member
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder for staff list (Requires new API endpoint to list staff, reusing api.users.list if exists or mock for now) */}
                <div className="col-span-full bg-blue-50 p-4 rounded-xl text-blue-700 border border-blue-100 mb-4">
                    <p className="flex items-center gap-2">
                        <Shield size={18} />
                        Only Clinic Admins can add new doctors or assistants.
                    </p>
                </div>
            </div>

            {isInviteOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-lg p-6 animate-in slide-in-from-bottom-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary-100 p-3 rounded-full text-primary-600">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Add Team Member</h2>
                                <p className="text-sm text-surface-500">Create account for new staff</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Dr. Smith" />
                            <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="staff@clinic.com" />
                            <Input label="Temporary Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
                                <select
                                    className="w-full rounded-xl border-surface-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 bg-white"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="assistant">Assistant</option>
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <Button variant="ghost" onClick={() => setIsInviteOpen(false)} type="button">Cancel</Button>
                                <Button type="submit" disabled={isLoading}>{isLoading ? 'Adding...' : 'Add Member'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
