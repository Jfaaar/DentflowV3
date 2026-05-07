// Reads the current clinic's specialty configuration from RTK Query.
// Used to gate dental-specific UI (DentalChart, Odontogram, tooth fields)
// and to switch in medical-specific UI (BodyRegionChart, SOAP editor, vitals).
//
// Specialty is orthogonal to role-permissions — do not couple them.
import { useGetSettingsQuery } from './api/settingsApi';
import type { SpecialtyCode } from './api/settingsApi';

const FALLBACK_PRIMARY: SpecialtyCode = 'general_practice';
const FALLBACK_ENABLED: SpecialtyCode[] = ['general_practice'];

export interface ClinicSpecialtyState {
  primarySpecialty: SpecialtyCode;
  enabledSpecialties: SpecialtyCode[];
  isLoading: boolean;
  has: (specialty: SpecialtyCode) => boolean;
  isDental: boolean;
  isGeneralPractice: boolean;
}

export function useClinicSpecialty(): ClinicSpecialtyState {
  const { data, isLoading } = useGetSettingsQuery();
  const primarySpecialty = data?.primarySpecialty ?? FALLBACK_PRIMARY;
  const enabledSpecialties = data?.enabledSpecialties?.length
    ? data.enabledSpecialties
    : FALLBACK_ENABLED;

  const has = (specialty: SpecialtyCode) => enabledSpecialties.includes(specialty);

  return {
    primarySpecialty,
    enabledSpecialties,
    isLoading,
    has,
    isDental: has('dental'),
    isGeneralPractice: has('general_practice'),
  };
}
