

import { Appointment, Patient, User, Invoice, Radio, Treatment, Quote, InventoryItem, Prescription, InventoryTransaction, Supplier, Clinic } from "../types";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { apiUrl } from "./apiBase";

// Helper to simulate network latency for a realistic UX (spinners, etc.)
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// Get Supabase access token for authenticated API calls
const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
};

export const api = {
    auth: {
        login: async (credentials: any): Promise<{ user: User, token: string }> => {
            const response = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();
            // Return both, useAuth will handle persistence
            return { user: data.user, token: data.token };
        },
        register: async (credentials: any): Promise<User> => {
            const response = await fetch(apiUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            const data = await response.json();
            // Persist token
            localStorage.setItem('dentflow_token', data.token);
            storage.setUser(data.user);
            return data.user;
        }
    },
    backoffice: {
        listClinics: async (): Promise<Clinic[]> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl('/api/backoffice/clinics'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch clinics');
            return response.json();
        },
        createClinic: async (data: any): Promise<any> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl('/api/backoffice/clinics'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create clinic');
            }
            return response.json();
        },
        updateClinic: async (id: string, data: any): Promise<Clinic> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/clinics/${id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update clinic');
            return response.json();
        },
        deleteClinic: async (id: string): Promise<boolean> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/clinics/${id}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete clinic');
            return true;
        },
        getStats: async (): Promise<{ totalClinics: number, totalUsers: number, activeSubscriptions: number }> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl('/api/backoffice/stats'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
        getClinicUsers: async (clinicId: string): Promise<User[]> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/clinics/${clinicId}/users`), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch clinic users');
            return response.json();
        },
        resetUserPassword: async (userId: string, password: string): Promise<boolean> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/users/${userId}/reset-password`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });
            if (!response.ok) throw new Error('Failed to reset password');
            return true;
        },
        updateUserRole: async (userId: string, role: string): Promise<User> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/users/${userId}/role`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role })
            });
            if (!response.ok) throw new Error('Failed to update role');
            return response.json();
        },
        createClinicUser: async (clinicId: string, data: any): Promise<User> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/clinics/${clinicId}/users`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }
            return response.json();
        },
        updateUser: async (userId: string, data: any): Promise<User> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/users/${userId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update user');
            return response.json();
        },
        deleteUser: async (userId: string): Promise<boolean> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl(`/api/backoffice/users/${userId}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete user');
            return true;
        }
    },
    staff: {
        create: async (data: any): Promise<User> => {
            const token = await getAccessToken();
            const response = await fetch(apiUrl('/api/staff'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add staff');
            }
            return response.json();
        }
    },
    patients: {
        list: async (): Promise<Patient[]> => {
            await delay();
            return storage.getPatients();
        },
        create: async (patient: Patient): Promise<Patient> => {
            await delay();
            const newPatient: Patient = {
                ...patient,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            storage.addPatient(newPatient);
            return newPatient;
        },
        update: async (patient: Patient): Promise<Patient> => {
            await delay();
            storage.updatePatient(patient);
            return patient;
        },
        delete: async (id: string): Promise<{ success: boolean }> => {
            await delay();
            storage.deletePatient(id);
            return { success: true };
        }
    },
    appointments: {
        list: async (): Promise<Appointment[]> => {
            await delay();
            return storage.getAppointments();
        },
        save: async (appointment: Partial<Appointment>, cancelIds: string[] = []): Promise<Appointment[]> => {
            await delay();
            let current = storage.getAppointments();

            // 1. Handle Cancellations (overwriting pending slots)
            if (cancelIds.length > 0) {
                current = current.map(a => cancelIds.includes(a.id) ? { ...a, status: 'canceled' as const } : a);
            }

            // 2. Handle Create or Update
            if (appointment.id) {
                // Update existing
                current = current.map(a =>
                    a.id === appointment.id ? { ...a, ...appointment } as Appointment : a
                );
            } else {
                // Create new
                const newAppt: Appointment = {
                    ...appointment,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString(),
                    status: appointment.status || 'pending'
                } as Appointment;
                current.push(newAppt);
            }

            storage.setAppointments(current);
            return current;
        },
        restore: async (id: string): Promise<Appointment[]> => {
            await delay();
            const current = storage.getAppointments().map(a =>
                a.id === id ? { ...a, status: 'pending' as const } : a
            );
            storage.setAppointments(current);
            return current;
        }
    },
    invoices: {
        list: async (): Promise<Invoice[]> => {
            await delay();
            return storage.getInvoices();
        },
        create: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
            await delay();
            const newInvoice = { ...invoice, id: Math.random().toString(36).substr(2, 9) };
            storage.addInvoice(newInvoice);
            return newInvoice;
        },
        update: async (invoice: Invoice): Promise<Invoice> => {
            await delay();
            storage.updateInvoice(invoice);
            return invoice;
        }
    },
    treatments: {
        list: async (patientId: string): Promise<Treatment[]> => {
            await delay();
            return storage.getTreatments().filter(t => t.patientId === patientId);
        },
        create: async (treatment: Omit<Treatment, 'id'>): Promise<Treatment> => {
            await delay();
            const newTreatment = { ...treatment, id: Math.random().toString(36).substr(2, 9) };
            storage.addTreatment(newTreatment);

            // Handle Material Usage
            if (newTreatment.status === 'completed' && newTreatment.materialsUsed && newTreatment.materialsUsed.length > 0) {
                const inventory = storage.getInventory();
                let inventoryChanged = false;

                newTreatment.materialsUsed.forEach(mat => {
                    const itemIndex = inventory.findIndex(i => i.id === mat.itemId);
                    if (itemIndex > -1) {
                        // Deduct stock
                        const currentStock = inventory[itemIndex].stock;
                        if (currentStock > 0) {
                            inventory[itemIndex].stock = Math.max(0, currentStock - mat.quantity);
                            inventoryChanged = true;

                            // Log transaction
                            storage.addInventoryTransaction({
                                id: Math.random().toString(36).substr(2, 9),
                                medicamentId: inventory[itemIndex].id,
                                medicamentName: inventory[itemIndex].name,
                                type: 'OUT',
                                quantity: mat.quantity,
                                date: new Date().toISOString(),
                                reason: `Clinical Use: ${newTreatment.description}`
                            });
                        }
                    }
                });

                if (inventoryChanged) {
                    storage.updateInventory(inventory);
                }
            }

            return newTreatment;
        }
    },
    quotes: {
        list: async (patientId: string): Promise<Quote[]> => {
            await delay();
            return storage.getQuotes().filter(q => q.patientId === patientId);
        },
        create: async (quote: Omit<Quote, 'id'>): Promise<Quote> => {
            await delay();
            const newQuote = { ...quote, id: Math.random().toString(36).substr(2, 9) };
            storage.addQuote(newQuote);
            return newQuote;
        }
    },
    radios: {
        list: async (patientId: string): Promise<Radio[]> => {
            await delay();
            const allRadios = storage.getRadios();
            return allRadios.filter(r => r.patientId === patientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        },
        upload: async (patientId: string, file: File): Promise<Radio> => {
            await delay(800); // Simulate upload time

            // Convert File to Base64 to store in LocalStorage (Offline Mode)
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const base64 = reader.result as string;
                    const newRadio: Radio = {
                        id: Math.random().toString(36).substr(2, 9),
                        patientId,
                        url: base64, // Store the actual image data
                        fileName: file.name,
                        date: new Date().toISOString()
                    };
                    try {
                        storage.addRadio(newRadio);
                        resolve(newRadio);
                    } catch (e) {
                        reject(new Error("Storage full"));
                    }
                };
                reader.onerror = (error) => reject(error);
            });
        },
        delete: async (id: string): Promise<boolean> => {
            await delay();
            storage.deleteRadio(id);
            return true;
        }
    },
    inventory: {
        list: async (): Promise<InventoryItem[]> => {
            await delay();
            return storage.getInventory();
        },
        create: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
            await delay();
            const inventory = storage.getInventory();
            const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
            storage.updateInventory([...inventory, newItem]);

            // Log initial stock
            storage.addInventoryTransaction({
                id: Math.random().toString(36).substr(2, 9),
                medicamentId: newItem.id,
                medicamentName: newItem.name,
                type: 'IN',
                quantity: newItem.stock,
                date: new Date().toISOString(),
                reason: 'Initial Stock'
            });

            return newItem;
        },
        update: async (item: InventoryItem): Promise<InventoryItem> => {
            await delay();
            const inventory = storage.getInventory();
            const updated = inventory.map(i => i.id === item.id ? item : i);
            storage.updateInventory(updated);
            return item;
        },
        delete: async (id: string): Promise<boolean> => {
            await delay();
            const inventory = storage.getInventory();
            const updated = inventory.filter(i => i.id !== id);
            storage.updateInventory(updated);
            return true;
        },
        adjustStock: async (id: string, quantity: number, reason: string): Promise<InventoryItem> => {
            await delay();
            const inventory = storage.getInventory();
            const item = inventory.find(i => i.id === id);
            if (!item) throw new Error("Item not found");

            const newStock = item.stock + quantity;
            if (newStock < 0) throw new Error("Insufficient stock");

            const updatedItem = { ...item, stock: newStock };
            const updatedInventory = inventory.map(i => i.id === id ? updatedItem : i);
            storage.updateInventory(updatedInventory);

            // Log transaction
            storage.addInventoryTransaction({
                id: Math.random().toString(36).substr(2, 9),
                medicamentId: item.id,
                medicamentName: item.name,
                type: quantity > 0 ? 'IN' : 'OUT',
                quantity: Math.abs(quantity),
                date: new Date().toISOString(),
                reason: reason
            });

            return updatedItem;
        }
    },
    suppliers: {
        list: async (): Promise<Supplier[]> => {
            await delay();
            return storage.getSuppliers();
        },
        create: async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
            await delay();
            const newSupplier = { ...supplier, id: Math.random().toString(36).substr(2, 9) };
            storage.addSupplier(newSupplier);
            return newSupplier;
        },
        update: async (supplier: Supplier): Promise<Supplier> => {
            await delay();
            storage.updateSupplier(supplier);
            return supplier;
        },
        delete: async (id: string): Promise<boolean> => {
            await delay();
            storage.deleteSupplier(id);
            return true;
        }
    },
    prescriptions: {
        list: async (patientId: string): Promise<Prescription[]> => {
            await delay();
            return storage.getPrescriptions().filter(p => p.patientId === patientId);
        },
        create: async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
            await delay();
            const newPrescription = { ...prescription, id: Math.random().toString(36).substr(2, 9) };

            // Deduct Stock
            const inventory = storage.getInventory();
            let inventoryChanged = false;

            newPrescription.items.forEach(item => {
                const drugIndex = inventory.findIndex(d => d.id === item.medicamentId);
                if (drugIndex > -1) {
                    // Simply decrement by 1 "unit" (e.g. 1 box) per prescription item entry for MVP
                    if (inventory[drugIndex].stock > 0) {
                        inventory[drugIndex].stock -= 1;
                        inventoryChanged = true;

                        // Auto log transaction
                        storage.addInventoryTransaction({
                            id: Math.random().toString(36).substr(2, 9),
                            medicamentId: inventory[drugIndex].id,
                            medicamentName: inventory[drugIndex].name,
                            type: 'OUT',
                            quantity: 1,
                            date: new Date().toISOString(),
                            reason: 'Prescription'
                        });
                    }
                }
            });

            if (inventoryChanged) {
                storage.updateInventory(inventory);
            }

            storage.addPrescription(newPrescription);
            return newPrescription;
        }
    }
};