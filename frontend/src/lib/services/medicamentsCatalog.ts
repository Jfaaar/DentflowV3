// Medicaments catalog — thin fetch shim over /api/v1/medicaments-catalog.
// Catalog rows are seeded from a local JSONL dump via the
// `npm run import:medicaments` backend script.
import { http } from '../http';

export interface CatalogMedicament {
  id: string;
  specialite: string;
  dosage: string | null;
  forme: string | null;
  presentation: string | null;
  ppGn: string | null;
  substanceActive: string | null;
  classeTherapeutique: string | null;
  laboratoire: string | null;
  statutAmm: string | null;
  statutCommercialisation: string | null;
  ppv: number | null;
  ph: number | null;
  pfht: number | null;
  tva: number | null;
  sourceUrl: string;
  sourceHash: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

// One row per `specialite` (brand). Variants of the same brand collapse into
// `variantCount` plus a price range.
export interface MedicamentGroup {
  specialite: string;
  laboratoire: string | null;
  substanceActive: string | null;
  classeTherapeutique: string | null;
  variantCount: number;
  commercializedCount: number;
  minPpv: number | null;
  maxPpv: number | null;
}

export interface CatalogStats {
  totalMedicaments: number;
  totalBrands: number;
  totalLabs: number;
  totalSubstances: number;
}

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  substance?: string;
  laboratoire?: string;
  specialite?: string;
}

interface GroupsOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  substance?: string;
  laboratoire?: string;
}

interface BackendPaged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const medicamentsCatalogService = {
  async list(opts: ListOpts = {}) {
    return http<BackendPaged<CatalogMedicament>>('GET', 'medicaments-catalog', {
      params: opts,
    });
  },
  async listGroups(opts: GroupsOpts = {}) {
    return http<BackendPaged<MedicamentGroup>>('GET', 'medicaments-catalog/groups', {
      params: opts,
    });
  },
  async getStats(): Promise<CatalogStats> {
    return http<CatalogStats>('GET', 'medicaments-catalog/stats');
  },
  async listLabs(): Promise<string[]> {
    return http<string[]>('GET', 'medicaments-catalog/labs');
  },
  async get(id: string): Promise<CatalogMedicament> {
    return http<CatalogMedicament>('GET', `medicaments-catalog/${id}`);
  },
};

export type {
  ListOpts as MedicamentsCatalogListOpts,
  GroupsOpts as MedicamentsCatalogGroupsOpts,
};
