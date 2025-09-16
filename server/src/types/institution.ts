// server/src/types/institution.ts

/**
 * Core Institution entity representing financial institutions from Plaid
 * Normalized from plaid_items table to eliminate duplication
 */
export interface Institution {
  /** Unique identifier for the institution in our system */
  id: string;
  
  /** Plaid's unique identifier for this institution */
  plaid_institution_id: string;
  
  /** Human-readable name of the institution */
  name: string;
  
  /** URL to institution's logo (if available from Plaid) */
  logo_url?: string;
  
  /** Primary color associated with the institution (hex format) */
  primary_color?: string;
  
  /** Website URL of the institution */
  url?: string;
  
  /** ISO timestamp when this record was created */
  created_at: string;
  
  /** ISO timestamp when this record was last updated */
  updated_at: string;
}

/**
 * Input type for creating a new institution
 * Excludes auto-generated fields (id, timestamps)
 */
export interface CreateInstitutionRequest {
  /** Plaid's unique identifier for this institution */
  plaid_institution_id: string;
  
  /** Human-readable name of the institution */
  name: string;
  
  /** URL to institution's logo (if available from Plaid) */
  logo_url?: string;
  
  /** Primary color associated with the institution (hex format) */
  primary_color?: string;
  
  /** Website URL of the institution */
  url?: string;
}

/**
 * Input type for updating an existing institution
 * All fields are optional since this is a partial update
 */
export interface UpdateInstitutionRequest {
  /** Human-readable name of the institution */
  name?: string;
  
  /** URL to institution's logo (if available from Plaid) */
  logo_url?: string;
  
  /** Primary color associated with the institution (hex format) */
  primary_color?: string;
  
  /** Website URL of the institution */
  url?: string;
}

/**
 * Query parameters for filtering institutions
 */
export interface InstitutionQuery {
  /** Filter by Plaid institution ID */
  plaid_institution_id?: string;
  
  /** Filter by institution name (case-insensitive partial match) */
  name?: string;
  
  /** Pagination: number of records to return (default: 50, max: 200) */
  limit?: number;
  
  /** Pagination: number of records to skip */
  offset?: number;
}

/**
 * Response type for paginated institution lists
 */
export interface InstitutionListResponse {
  /** Array of institutions matching the query */
  institutions: Institution[];
  
  /** Total number of institutions available (for pagination) */
  total: number;
  
  /** Number of institutions returned in this response */
  count: number;
  
  /** Number of records skipped (offset) */
  offset: number;
}

/**
 * Database row representation (snake_case for DB compatibility)
 * Used internally by repositories for DB operations
 */
export interface InstitutionRow {
  id: string;
  plaid_institution_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  url: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Utility type for converting between DB rows and API entities
 */
export type InstitutionRowInput = Omit<InstitutionRow, 'id' | 'created_at' | 'updated_at'>;
