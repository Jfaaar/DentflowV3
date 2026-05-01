/**
 * Services Layer - Abstraction for backend operations
 *
 * This allows swapping implementations without changing component code:
 * - authService: Supabase Auth (can swap to Firebase, Auth0, etc.)
 * - adminService: Express API (can swap to Edge Functions, direct Supabase, etc.)
 * - domain services: Supabase (clinical/financial entities)
 */

export { authService, type AppUser } from './auth';
export { adminService, type Customer } from './admin';

// Domain services (Phase 2 — Supabase-backed)
export { patientsService } from './patients';
export { appointmentsService } from './appointments';
export { invoicesService } from './invoices';
export { paymentsService } from './payments';
export { treatmentsService } from './treatments';
export { treatmentPlansService } from './treatmentPlans';
export { quotesService } from './quotes';
export { prescriptionsService } from './prescriptions';
export { inventoryService } from './inventory';
export { inventoryTransactionsService } from './inventoryTransactions';
export { suppliersService } from './suppliers';
export { documentsService, radiosService } from './documents';
export { clinicalNotesService } from './clinicalNotes';
export { dentalChartService } from './dentalChart';
export { insuranceService } from './insurance';
export { settingsService, type ClinicSettings } from './settings';
