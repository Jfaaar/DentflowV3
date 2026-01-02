

import { Appointment, User, Patient, Invoice, Radio, Treatment, Quote, InventoryItem, Prescription, InventoryTransaction, Supplier } from "../types";

const KEYS = {
  USER: 'dentflow_user',
  APPOINTMENTS: 'dentflow_appointments',
  PATIENTS: 'dentflow_patients',
  LANGUAGE: 'dentflow_language',
  INVOICES: 'dentflow_invoices',
  RADIOS: 'dentflow_radios',
  TREATMENTS: 'dentflow_treatments',
  QUOTES: 'dentflow_quotes',
  INVENTORY: 'dentflow_inventory',
  INVENTORY_TRANSACTIONS: 'dentflow_inventory_transactions',
  PRESCRIPTIONS: 'dentflow_prescriptions',
  SUPPLIERS: 'dentflow_suppliers',
};

export const storage = {
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },
  setUser: (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  removeUser: () => {
    localStorage.removeItem(KEYS.USER);
  },
  
  // Language
  getLanguage: (): string => {
    return localStorage.getItem(KEYS.LANGUAGE) || 'en';
  },
  setLanguage: (lang: string) => {
    localStorage.setItem(KEYS.LANGUAGE, lang);
  },

  // Appointment Methods
  getAppointments: (): Appointment[] => {
    try {
      const data = localStorage.getItem(KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  setAppointments: (appointments: Appointment[]) => {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },
  addAppointment: (apt: Appointment) => {
    const current = storage.getAppointments();
    const updated = [...current, apt];
    storage.setAppointments(updated);
    return updated;
  },
  updateAppointment: (apt: Appointment) => {
    const current = storage.getAppointments();
    const updated = current.map(a => a.id === apt.id ? apt : a);
    storage.setAppointments(updated);
    return updated;
  },

  // Patient Methods
  getPatients: (): Patient[] => {
    try {
      const data = localStorage.getItem(KEYS.PATIENTS);
      if (!data) {
        // Seed mock data for MVP
        const mocks: Patient[] = [
          { id: 'p1', name: 'Sarah Connor', phone: '555-0199', email: 'sarah@example.com', createdAt: '2023-01-15T10:00:00Z', gender: 'female', status: 'active', birthDate: '1985-05-20' },
          { id: 'p2', name: 'John Wick', phone: '555-0122', email: 'john@continental.com', createdAt: '2023-02-20T14:30:00Z', gender: 'male', status: 'active', birthDate: '1980-09-02' },
          { id: 'p3', name: 'Ellen Ripley', phone: '555-0155', createdAt: '2023-03-10T09:15:00Z', gender: 'female', status: 'archived' },
          { id: 'p4', name: 'Marty McFly', phone: '555-1985', createdAt: '2023-10-21T16:20:00Z', gender: 'male', status: 'active' },
        ];
        localStorage.setItem(KEYS.PATIENTS, JSON.stringify(mocks));
        return mocks;
      }
      return JSON.parse(data);
    } catch (e) { return []; }
  },
  addPatient: (patient: Patient) => {
    const current = storage.getPatients();
    const updated = [...current, patient];
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },
  updatePatient: (patient: Patient) => {
    const current = storage.getPatients();
    const updated = current.map(p => p.id === patient.id ? patient : p);
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },
  deletePatient: (id: string) => {
    const current = storage.getPatients();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },

  // Invoice Methods
  getInvoices: (): Invoice[] => {
    try {
      const data = localStorage.getItem(KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  addInvoice: (invoice: Invoice) => {
    const current = storage.getInvoices();
    const updated = [...current, invoice];
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
    return updated;
  },
  updateInvoice: (invoice: Invoice) => {
    const current = storage.getInvoices();
    const updated = current.map(i => i.id === invoice.id ? invoice : i);
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
    return updated;
  },

  // Radio Methods
  getRadios: (): Radio[] => {
    try {
      const data = localStorage.getItem(KEYS.RADIOS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  addRadio: (radio: Radio) => {
    const current = storage.getRadios();
    const updated = [radio, ...current];
    try {
        localStorage.setItem(KEYS.RADIOS, JSON.stringify(updated));
    } catch (e) {
        console.error("LocalStorage quota exceeded", e);
        throw new Error("Storage full");
    }
    return updated;
  },
  deleteRadio: (id: string) => {
    const current = storage.getRadios();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(KEYS.RADIOS, JSON.stringify(updated));
    return updated;
  },

  // Treatments
  getTreatments: (): Treatment[] => {
    try {
        const data = localStorage.getItem(KEYS.TREATMENTS);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  addTreatment: (treatment: Treatment) => {
      const current = storage.getTreatments();
      const updated = [...current, treatment];
      localStorage.setItem(KEYS.TREATMENTS, JSON.stringify(updated));
      return updated;
  },

  // Quotes
  getQuotes: (): Quote[] => {
      try {
          const data = localStorage.getItem(KEYS.QUOTES);
          return data ? JSON.parse(data) : [];
      } catch (e) { return []; }
  },
  addQuote: (quote: Quote) => {
      const current = storage.getQuotes();
      const updated = [...current, quote];
      localStorage.setItem(KEYS.QUOTES, JSON.stringify(updated));
      return updated;
  },

  // Inventory (Items)
  getInventory: (): InventoryItem[] => {
    try {
        const data = localStorage.getItem(KEYS.INVENTORY);
        if (!data) {
            // Seed
            const seed: InventoryItem[] = [
                { id: 'm1', name: 'Amoxicillin', type: 'medicament', form: 'Tablet', stock: 100, minStock: 20, description: 'Antibiotic 500mg', category: 'Antibiotics', expiryDate: '2025-12-31', supplier: 'PharmaCorp' },
                { id: 'm2', name: 'Ibuprofen', type: 'medicament', form: 'Tablet', stock: 50, minStock: 15, description: 'Painkiller 400mg', category: 'Analgesics', expiryDate: '2024-10-15', supplier: 'MediSupply' },
                { id: 'm3', name: 'Lidocaine', type: 'medicament', form: 'Injection', stock: 8, minStock: 10, description: 'Local Anesthetic', category: 'Anesthetics', expiryDate: '2024-06-01', supplier: 'PharmaCorp' },
                { id: 'e1', name: 'Dental Chair', type: 'equipment', stock: 2, minStock: 2, serialNumber: 'DC-2023-X99', lastMaintenance: '2023-11-01', category: 'Furniture', supplier: 'DentEquip Inc' },
                { id: 'c1', name: 'Latex Gloves', type: 'consumable', stock: 50, minStock: 10, brand: 'MediGlove', category: 'Hygiene', supplier: 'MediSupply' },
                { id: 'c2', name: 'Face Masks', type: 'consumable', stock: 20, minStock: 5, brand: 'SafeGuard', category: 'Hygiene', supplier: 'MediSupply' }
            ];
            localStorage.setItem(KEYS.INVENTORY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(data);
    } catch (e) { return []; }
  },
  updateInventory: (items: InventoryItem[]) => {
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
  },

  // Suppliers
  getSuppliers: (): Supplier[] => {
    try {
        const data = localStorage.getItem(KEYS.SUPPLIERS);
        if (!data) {
            // Seed
            const seed: Supplier[] = [
                { id: 's1', name: 'PharmaCorp', contactPerson: 'Alice Smith', phone: '555-0101', email: 'orders@pharmacorp.com', address: '123 Pharma Way' },
                { id: 's2', name: 'MediSupply', contactPerson: 'Bob Jones', phone: '555-0202', email: 'sales@medisupply.com', address: '456 Supply St' },
                { id: 's3', name: 'DentEquip Inc', contactPerson: 'Charlie Brown', phone: '555-0303', email: 'support@dentequip.com', address: '789 Equipment Blvd' }
            ];
            localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(data);
    } catch (e) { return []; }
  },
  addSupplier: (supplier: Supplier) => {
      const current = storage.getSuppliers();
      const updated = [...current, supplier];
      localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(updated));
      return updated;
  },
  updateSupplier: (supplier: Supplier) => {
      const current = storage.getSuppliers();
      const updated = current.map(s => s.id === supplier.id ? supplier : s);
      localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(updated));
      return updated;
  },
  deleteSupplier: (id: string) => {
      const current = storage.getSuppliers();
      const updated = current.filter(s => s.id !== id);
      localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(updated));
      return updated;
  },

  // Inventory Transactions
  getInventoryTransactions: (): InventoryTransaction[] => {
      try {
          const data = localStorage.getItem(KEYS.INVENTORY_TRANSACTIONS);
          return data ? JSON.parse(data) : [];
      } catch (e) { return []; }
  },
  addInventoryTransaction: (tx: InventoryTransaction) => {
      const current = storage.getInventoryTransactions();
      const updated = [tx, ...current]; // Newest first
      localStorage.setItem(KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(updated));
      return updated;
  },

  // Prescriptions
  getPrescriptions: (): Prescription[] => {
      try {
          const data = localStorage.getItem(KEYS.PRESCRIPTIONS);
          return data ? JSON.parse(data) : [];
      } catch (e) { return []; }
  },
  addPrescription: (prescription: Prescription) => {
      const current = storage.getPrescriptions();
      const updated = [...current, prescription];
      localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      return updated;
  }
};