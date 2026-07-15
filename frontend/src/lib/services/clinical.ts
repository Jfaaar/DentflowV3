// Re-export the canonical clinical notes service. The legacy Supabase-direct
// implementation is gone; clinicalNotes.ts is the fetch-shim version.
export { clinicalNotesService as clinicalService } from './clinicalNotes';
