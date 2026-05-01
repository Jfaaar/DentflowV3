/**
 * Legacy `api` facade — preserves the call surface used across feature pages
 * while delegating clinical/financial entities to the new Supabase-backed
 * services in `lib/services/*`.
 *
 * The `api.auth` and `api.backoffice` (Express-backed) sections are
 * intentionally untouched per Phase 2 scope.
 */

import {
  Appointment,
  Patient,
  User,
  Invoice,
  Radio,
  Treatment,
  Quote,
  InventoryItem,
  Prescription,
  Supplier,
  Clinic,
} from '../types';
import { storage } from './storage';
import { supabase } from './supabase';
import { apiUrl } from './apiBase';
import {
  patientsService,
  appointmentsService,
  invoicesService,
  treatmentsService,
  quotesService,
  prescriptionsService,
  inventoryService,
  suppliersService,
  radiosService,
} from './services';

// Get Supabase access token for authenticated API calls
const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

export const api = {
  auth: {
    login: async (credentials: any): Promise<{ user: User; token: string }> => {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
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
        body: JSON.stringify(credentials),
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
    },
  },
  backoffice: {
    listClinics: async (): Promise<Clinic[]> => {
      const token = await getAccessToken();
      const response = await fetch(apiUrl('/api/backoffice/clinics'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update clinic');
      return response.json();
    },
    deleteClinic: async (id: string): Promise<boolean> => {
      const token = await getAccessToken();
      const response = await fetch(apiUrl(`/api/backoffice/clinics/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete clinic');
      return true;
    },
    getStats: async (): Promise<{
      totalClinics: number;
      totalUsers: number;
      activeSubscriptions: number;
    }> => {
      const token = await getAccessToken();
      const response = await fetch(apiUrl('/api/backoffice/stats'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    getClinicUsers: async (clinicId: string): Promise<User[]> => {
      const token = await getAccessToken();
      const response = await fetch(
        apiUrl(`/api/backoffice/clinics/${clinicId}/users`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error('Failed to fetch clinic users');
      return response.json();
    },
    resetUserPassword: async (
      userId: string,
      password: string,
    ): Promise<boolean> => {
      const token = await getAccessToken();
      const response = await fetch(
        apiUrl(`/api/backoffice/users/${userId}/reset-password`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        },
      );
      if (!response.ok) throw new Error('Failed to reset password');
      return true;
    },
    updateUserRole: async (userId: string, role: string): Promise<User> => {
      const token = await getAccessToken();
      const response = await fetch(
        apiUrl(`/api/backoffice/users/${userId}/role`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        },
      );
      if (!response.ok) throw new Error('Failed to update role');
      return response.json();
    },
    createClinicUser: async (clinicId: string, data: any): Promise<User> => {
      const token = await getAccessToken();
      const response = await fetch(
        apiUrl(`/api/backoffice/clinics/${clinicId}/users`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      );
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    deleteUser: async (userId: string): Promise<boolean> => {
      const token = await getAccessToken();
      const response = await fetch(apiUrl(`/api/backoffice/users/${userId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return true;
    },
  },
  staff: {
    create: async (data: any): Promise<User> => {
      const token = await getAccessToken();
      const response = await fetch(apiUrl('/api/staff'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add staff');
      }
      return response.json();
    },
  },
  // ────────────── Domain entities (Supabase-backed) ──────────────
  patients: {
    list: async (
      opts: { search?: string; page?: number; pageSize?: number; status?: 'active' | 'archived' } = {},
    ): Promise<Patient[]> => {
      const { data } = await patientsService.list({
        search: opts.search,
        page: opts.page,
        pageSize: opts.pageSize,
        filters: opts.status ? { status: opts.status } : undefined,
      });
      return data;
    },
    listPaged: async (opts: {
      search?: string;
      page?: number;
      pageSize?: number;
      status?: 'active' | 'archived';
    } = {}) => {
      return patientsService.list({
        search: opts.search,
        page: opts.page,
        pageSize: opts.pageSize,
        filters: opts.status ? { status: opts.status } : undefined,
      });
    },
    create: async (patient: Patient): Promise<Patient> => {
      const { id: _omitId, createdAt: _omitCreatedAt, ...rest } = patient;
      void _omitId;
      void _omitCreatedAt;
      return patientsService.create({ ...rest, status: rest.status ?? 'active' });
    },
    update: async (patient: Patient): Promise<Patient> => {
      return patientsService.update(patient);
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      await patientsService.delete(id);
      return { success: true };
    },
  },
  appointments: {
    list: async (): Promise<Appointment[]> => {
      const { data } = await appointmentsService.list({ pageSize: 500 });
      return data;
    },
    save: async (
      appointment: Partial<Appointment>,
      cancelIds: string[] = [],
    ): Promise<Appointment[]> => {
      if (cancelIds.length > 0) {
        await appointmentsService.cancelMany(cancelIds);
      }

      if (appointment.id) {
        await appointmentsService.update({
          id: appointment.id,
          patientId: appointment.patientId,
          start: appointment.start,
          end: appointment.end,
          status: appointment.status,
          observation: appointment.observation,
        });
      } else if (appointment.patientId && appointment.start && appointment.end) {
        await appointmentsService.create({
          patientId: appointment.patientId,
          patientName: appointment.patientName ?? '',
          start: appointment.start,
          end: appointment.end,
          status: appointment.status ?? 'pending',
          observation: appointment.observation,
        });
      }

      const { data } = await appointmentsService.list({ pageSize: 500 });
      return data;
    },
    restore: async (id: string): Promise<Appointment[]> => {
      await appointmentsService.restore(id);
      const { data } = await appointmentsService.list({ pageSize: 500 });
      return data;
    },
  },
  invoices: {
    list: async (): Promise<Invoice[]> => {
      const { data } = await invoicesService.list({ pageSize: 500 });
      return data;
    },
    create: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
      return invoicesService.create(invoice);
    },
    update: async (invoice: Invoice): Promise<Invoice> => {
      return invoicesService.update(invoice);
    },
  },
  treatments: {
    list: async (patientId: string): Promise<Treatment[]> => {
      const { data } = await treatmentsService.list({ patientId, pageSize: 500 });
      return data;
    },
    create: async (treatment: Omit<Treatment, 'id'>): Promise<Treatment> => {
      return treatmentsService.create(treatment);
    },
  },
  quotes: {
    list: async (patientId: string): Promise<Quote[]> => {
      const { data } = await quotesService.list({ patientId, pageSize: 500 });
      return data;
    },
    create: async (quote: Omit<Quote, 'id'>): Promise<Quote> => {
      return quotesService.create(quote);
    },
  },
  radios: {
    list: async (patientId: string): Promise<Radio[]> => {
      return radiosService.list(patientId);
    },
    upload: async (patientId: string, file: File): Promise<Radio> => {
      return radiosService.upload(patientId, file);
    },
    delete: async (id: string): Promise<boolean> => {
      await radiosService.delete(id);
      return true;
    },
  },
  inventory: {
    list: async (): Promise<InventoryItem[]> => {
      const { data } = await inventoryService.list({ pageSize: 500 });
      return data;
    },
    create: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
      return inventoryService.create(item);
    },
    update: async (item: InventoryItem): Promise<InventoryItem> => {
      return inventoryService.update(item);
    },
    delete: async (id: string): Promise<boolean> => {
      await inventoryService.delete(id);
      return true;
    },
    adjustStock: async (
      id: string,
      quantity: number,
      reason: string,
    ): Promise<InventoryItem> => {
      return inventoryService.adjustStock(id, quantity, reason);
    },
  },
  suppliers: {
    list: async (): Promise<Supplier[]> => {
      const { data } = await suppliersService.list({ pageSize: 500 });
      return data;
    },
    create: async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
      return suppliersService.create(supplier);
    },
    update: async (supplier: Supplier): Promise<Supplier> => {
      return suppliersService.update(supplier);
    },
    delete: async (id: string): Promise<boolean> => {
      await suppliersService.delete(id);
      return true;
    },
  },
  prescriptions: {
    list: async (patientId: string): Promise<Prescription[]> => {
      const { data } = await prescriptionsService.list({ patientId, pageSize: 500 });
      return data;
    },
    create: async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
      return prescriptionsService.create(prescription);
    },
  },
};
