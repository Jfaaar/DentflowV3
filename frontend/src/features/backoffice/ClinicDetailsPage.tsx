import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Clinic, User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ChevronLeft, Users, Key, Shield } from 'lucide-react';

interface Props {
    clinicId: string;
    onBack: () => void;
}

export const ClinicDetailsPage: React.FC<Props> = ({ clinicId, onBack }) => {
    const [clinic, setClinic] = useState<Clinic | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modals
    const [resetPassUser, setResetPassUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [roleUser, setRoleUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('');

    // CRUD Modals
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // User Form State
    const [uName, setUName] = useState('');
    const [uEmail, setUEmail] = useState('');
    const [uPass, setUPass] = useState('');
    const [uRole, setURole] = useState('assistant');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const allClinics = await api.backoffice.listClinics();
            const found = allClinics.find(c => c.id === clinicId);
            setClinic(found || null);

            const staff = await api.backoffice.getClinicUsers(clinicId);
            setUsers(staff);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [clinicId]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.backoffice.createClinicUser(clinicId, {
                name: uName, email: uEmail, password: uPass, role: uRole
            });
            setIsAddUserOpen(false);
            resetUserForm();
            loadData();
        } catch (e) {
            alert('Failed to add user');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await api.backoffice.updateUser(editingUser.id, {
                name: uName, email: uEmail
            });
            setEditingUser(null);
            resetUserForm();
            loadData();
        } catch (e) {
            alert('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Permanently delete this user?')) return;
        try {
            await api.backoffice.deleteUser(userId);
            loadData();
        } catch (e) {
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async () => {
        if (!resetPassUser || !newPassword) return;
        try {
            await api.backoffice.resetUserPassword(resetPassUser.id, newPassword);
            alert(`Password reset successful for ${resetPassUser.name}`);
            setResetPassUser(null);
            setNewPassword('');
        } catch (e) {
            alert('Failed to reset password');
        }
    };

    const handleUpdateRole = async () => {
        if (!roleUser || !newRole) return;
        try {
            await api.backoffice.updateUserRole(roleUser.id, newRole);
            alert(`Role updated for ${roleUser.name}`);
            setRoleUser(null);
            loadData();
        } catch (e) {
            alert('Failed to update role');
        }
    };

    const openEditUser = (user: User) => {
        setEditingUser(user);
        setUName(user.name);
        setUEmail(user.email);
    };

    const resetUserForm = () => {
        setUName(''); setUEmail(''); setUPass(''); setURole('assistant');
    };

    if (!clinic) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right-10 duration-500">
            <header className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{clinic.name}</h1>
                    <div className="flex items-center gap-2 text-surface-500">
                        <span>{clinic.address}</span>
                        <span>•</span>
                        <span>{users.length} Active Staff</span>
                    </div>
                </div>
            </header>

            <Card className="p-6 border-surface-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users size={20} className="text-primary-600" />
                        Staff Management
                    </h2>
                    <Button onClick={() => setIsAddUserOpen(true)}>Add Staff</Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 text-surface-500 text-sm">
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                    <td className="py-3 px-4 font-medium text-surface-900">{user.name}</td>
                                    <td className="py-3 px-4 text-surface-600">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-700 text-xs font-medium uppercase tracking-wider">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEditUser(user)}>Edit</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setRoleUser(user)}>
                                            <Shield size={14} className="mr-1" /> Role
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-primary-600 hover:bg-primary-50" onClick={() => setResetPassUser(user)}>
                                            <Key size={14} className="mr-1" /> Reset Pass
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(user.id)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">Add Staff Member</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <Input label="Name" value={uName} onChange={e => setUName(e.target.value)} required />
                            <Input label="Email" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} required />
                            <Input label="Password" type="password" value={uPass} onChange={e => setUPass(e.target.value)} required />

                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
                                <select
                                    className="w-full rounded-xl border border-surface-200 p-2.5 bg-transparent"
                                    value={uRole}
                                    onChange={e => setURole(e.target.value)}
                                >
                                    <option value="assistant">Assistant</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="clinic_admin">Clinic Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <Button variant="ghost" onClick={() => setIsAddUserOpen(false)} type="button">Cancel</Button>
                                <Button type="submit">Create User</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">Edit User</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <Input label="Name" value={uName} onChange={e => setUName(e.target.value)} required />
                            <Input label="Email" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} required />

                            <div className="flex gap-2 justify-end mt-6">
                                <Button variant="ghost" onClick={() => setEditingUser(null)} type="button">Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPassUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">Reset Password</h3>
                        <p className="text-sm text-surface-500 mb-4">Set a new temporary password for <strong>{resetPassUser.name}</strong>.</p>
                        <Input
                            label="New Password"
                            type="text" // Visible for admin convenience
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                        <div className="flex gap-2 justify-end mt-6">
                            <Button variant="ghost" onClick={() => setResetPassUser(null)}>Cancel</Button>
                            <Button onClick={handleResetPassword}>Save Password</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Change Role Modal */}
            {roleUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">Change Role</h3>
                        <p className="text-sm text-surface-500 mb-4">Update permissions for <strong>{roleUser.name}</strong>.</p>

                        <div className="space-y-2">
                            {['clinic_admin', 'doctor', 'assistant'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => setNewRole(role)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${newRole === role
                                        ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-200'
                                        : 'border-surface-200 hover:border-surface-300'
                                        }`}
                                >
                                    <div className="font-medium capitalize">{role.replace('_', ' ')}</div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <Button variant="ghost" onClick={() => setRoleUser(null)}>Cancel</Button>
                            <Button onClick={handleUpdateRole} disabled={!newRole}>Update Role</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
