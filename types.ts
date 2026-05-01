
export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'cancelled';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  maxStaff: number;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';
  clinicId?: string; // Optional for super_admin
  avatar?: string;
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'canceled' | 'completed';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string;
  address?: string;
  birthDate?: string; // ISO Date
  gender?: 'male' | 'female';
  medicalHistory?: MedicalHistory;
  insuranceProvider?: string; // e.g., CNSS, CNOPS
  status?: 'active' | 'archived';
  createdAt?: string;
}

export interface MedicalHistory {
  allergies: string[];
  conditions: string[]; // e.g. Diabetes, Hypertension
  medications: string[];
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for MVP display
  start: string; // ISO Date String
  end: string; // ISO Date String
  status: AppointmentStatus;
  observation?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method?: 'cash' | 'card' | 'transfer' | 'check';
  note?: string;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number; // Total amount required
  paidAmount: number; // Amount paid so far
  payments: Payment[]; // History of transactions
  status: 'paid' | 'unpaid' | 'partial';
  date: string; // ISO Date String of issuance
}

export interface ConsumedMaterial {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface Treatment {
  id: string;
  patientId: string;
  date: string;
  tooth?: string; // 11, 21, etc.
  surface?: string; // e.g., "Mesial", "Distal", "Occlusal"
  description: string; // e.g., "Composite Filling"
  price: number;
  status: 'planned' | 'completed';
  materialsUsed?: ConsumedMaterial[]; // Inventory items consumed
}

export interface Quote {
  id: string;
  patientId: string;
  treatments: Treatment[]; // Embedded for simplicity
  total: number;
  date: string;
  status: 'draft' | 'accepted' | 'rejected';
}

export interface Radio {
  id: string;
  patientId: string;
  url: string;
  fileName: string;
  date: string; // ISO Date
  note?: string;
}

// --- INVENTORY & PRESCRIPTIONS ---

export type InventoryItemType = 'medicament' | 'consumable' | 'equipment';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  category?: string; // e.g. Antibiotic, Hygiene, Surgical, PPE
  stock: number;
  minStock: number; // Low stock alert threshold
  supplier?: string;
  price?: number; // Cost price per unit (optional)
  description?: string;

  // Medicament Specific
  form?: string; // e.g., Tablet, Syrup, Injection
  expiryDate?: string; // ISO Date

  // Equipment/Consumable Specific
  brand?: string;
  serialNumber?: string; // Equipment only
  lastMaintenance?: string; // Equipment only
  location?: string; // Shelf A, Cabinet 2
}

// Alias for backward compatibility if needed, though we will update usages
export type Medicament = InventoryItem;

export interface InventoryTransaction {
  id: string;
  medicamentId: string;
  medicamentName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason?: string;
  date: string;
}

export interface PrescriptionItem {
  medicamentId: string;
  medicamentName: string; // Denormalized for display
  dosage: string; // e.g., "500mg"
  frequency: string; // e.g., "2 times a day"
  duration: string; // e.g., "5 days"
  note?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  items: PrescriptionItem[];
  notes?: string;
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface DaySummary {
  date: Date;
  confirmed: number;
  pending: number;
  canceled: number;
  appointments: Appointment[];
}

// ─── Phase 2 additions (Supabase migration) ────────────────────────────────
// New entities backing the clinical tables defined in supabase/migrations/0002.

export type PatientStatus = 'active' | 'archived' | 'deceased' | 'transferred';

export interface ClinicalNote {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  consultationReason?: string;
  symptoms?: string;
  diagnosis?: string;
  notes?: string;
  treatmentPlan?: string;
  followUp?: string;
  vitals?: Record<string, number | string>;
  signedAt?: string; // locked when set
  createdAt: string;
  updatedAt: string;
}

export interface DentalChartEntry {
  id: string;
  clinicId: string;
  patientId: string;
  tooth: string;
  surface?: string;
  finding: string;
  notes?: string;
  recordedAt: string;
  recordedBy?: string;
}

export interface TreatmentPlan {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId?: string;
  title?: string;
  status: 'draft' | 'proposed' | 'accepted' | 'rejected' | 'completed' | 'canceled';
  estimatedTotal?: number;
  discount?: number;
  insuranceCovered?: number;
  patientResponsibility?: number;
  acceptedAt?: string;
}

export interface InsurancePolicy {
  id: string;
  clinicId: string;
  patientId: string;
  providerId?: string;
  policyNumber?: string;
  coveragePct?: number;
  validUntil?: string;
}

export interface InsuranceClaim {
  id: string;
  clinicId: string;
  patientId: string;
  invoiceId?: string;
  policyId?: string;
  status:
    | 'draft'
    | 'submitted'
    | 'accepted'
    | 'rejected'
    | 'paid'
    | 'partially_paid';
  submittedAt?: string;
  amountClaimed?: number;
  amountReimbursed?: number;
  notes?: string;
}

export interface ClinicDocument {
  id: string;
  clinicId: string;
  patientId?: string;
  appointmentId?: string;
  category:
    | 'radiology'
    | 'consent'
    | 'insurance'
    | 'certificate'
    | 'prescription_pdf'
    | 'invoice_pdf'
    | 'plan_pdf'
    | 'other';
  fileName: string;
  storagePath: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  clinicId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}