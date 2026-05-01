
export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  maxStaff: number;
  subscriptionStatus: 'active' | 'inactive';
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

// --- PHASE 3: CLINICAL TYPES (additions documented in ARCHITECTURE.md §5) ---

export interface Vitals {
  bloodPressure?: string; // e.g. "120/80"
  heartRate?: number;
  temperature?: number; // celsius
  weight?: number; // kg
  height?: number; // cm
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  appointmentId?: string;
  authorId: string;
  authorName?: string;
  reason?: string;
  symptoms?: string;
  diagnosis?: string;
  notes?: string;
  treatmentPlan?: string;
  followUp?: string;
  vitals?: Vitals;
  signedAt?: string | null; // ISO date once locked
  signedBy?: string | null;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'filling'
  | 'crown'
  | 'extraction'
  | 'implant'
  | 'rootCanal'
  | 'missing'
  | 'fracture'
  | 'other';

export interface DentalChartEntry {
  id: string;
  patientId: string;
  toothId: string; // FDI notation, e.g. "11"
  surface?: string; // M/D/O/B/L
  condition: ToothCondition;
  note?: string;
  color?: string;
  clinicId: string;
  createdAt: string;
  authorId?: string;
}

export type TreatmentPlanStatus =
  | 'draft'
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'completed';

export interface TreatmentPlanItem {
  id: string;
  planId: string;
  toothId?: string;
  description: string;
  price: number;
  quantity: number;
  estimatedDuration?: number; // minutes
  status?: 'planned' | 'completed';
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName?: string;
  title: string;
  notes?: string;
  status: TreatmentPlanStatus;
  total: number;
  acceptedAt?: string | null;
  clinicId: string;
  createdAt: string;
  items?: TreatmentPlanItem[];
}

export interface TreatmentMaterial {
  id?: string;
  treatmentId: string;
  itemId: string;
  itemName?: string;
  quantity: number;
  clinicId: string;
}

// --- INSURANCE ---

export interface InsuranceProvider {
  id: string;
  name: string;
  code?: string;
  contactPhone?: string;
  contactEmail?: string;
  defaultCoveragePct?: number;
  clinicId?: string | null; // null = global preset
  createdAt?: string;
}

export interface InsurancePolicy {
  id: string;
  patientId: string;
  providerId: string;
  providerName?: string;
  policyNumber: string;
  groupNumber?: string;
  validFrom?: string;
  validTo?: string;
  coveragePct?: number;
  notes?: string;
  clinicId: string;
  createdAt: string;
}

export type InsuranceClaimStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'reimbursed';

export interface InsuranceClaim {
  id: string;
  policyId: string;
  patientId: string;
  invoiceId?: string;
  amount: number;
  reimbursedAmount?: number;
  status: InsuranceClaimStatus;
  submittedAt?: string;
  reimbursedAt?: string;
  notes?: string;
  clinicId: string;
  createdAt: string;
}