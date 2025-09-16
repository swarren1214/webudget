// server/src/repositories/interfaces/institution.repository.interface.ts

import { Institution, CreateInstitutionRequest, UpdateInstitutionRequest, InstitutionQuery, InstitutionListResponse } from '../../types/institution';

/**
 * Repository interface for Institution data access operations.
 * Defines the contract that all institution repository implementations must follow.
 * 
 * This interface abstracts data persistence details and ensures consistent
 * data access patterns across different storage implementations.
 */
export interface IInstitutionRepository {
  /**
   * Create a new institution record
   * @param institutionData - Institution data to create
   * @returns Promise resolving to the created institution
   * @throws {ValidationError} When required fields are missing or invalid
   * @throws {ConflictError} When plaid_institution_id already exists
   */
  create(institutionData: CreateInstitutionRequest): Promise<Institution>;

  /**
   * Find an institution by its unique internal ID
   * @param id - The institution's internal ID
   * @returns Promise resolving to institution or null if not found
   */
  findById(id: string): Promise<Institution | null>;

  /**
   * Find an institution by its Plaid institution ID
   * @param plaidInstitutionId - Plaid's unique identifier for the institution
   * @returns Promise resolving to institution or null if not found
   */
  findByPlaidId(plaidInstitutionId: string): Promise<Institution | null>;

  /**
   * Find institutions matching the given query criteria
   * @param query - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated institution list
   */
  findMany(query: InstitutionQuery): Promise<InstitutionListResponse>;

  /**
   * Update an existing institution
   * @param id - The institution's internal ID
   * @param updateData - Partial institution data to update
   * @returns Promise resolving to updated institution or null if not found
   * @throws {ValidationError} When update data is invalid
   */
  update(id: string, updateData: UpdateInstitutionRequest): Promise<Institution | null>;

  /**
   * Delete an institution by ID
   * @param id - The institution's internal ID
   * @returns Promise resolving to true if deleted, false if not found
   * @throws {ConflictError} When institution has dependent plaid_items
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if an institution exists by Plaid institution ID
   * @param plaidInstitutionId - Plaid's unique identifier for the institution
   * @returns Promise resolving to true if exists, false otherwise
   */
  existsByPlaidId(plaidInstitutionId: string): Promise<boolean>;

  /**
   * Get count of total institutions in the system
   * @returns Promise resolving to total institution count
   */
  count(): Promise<number>;

  /**
   * Find or create an institution based on Plaid institution data
   * Used during plaid_items creation to ensure institution exists
   * @param plaidInstitutionId - Plaid's unique identifier
   * @param institutionName - Institution name from Plaid
   * @returns Promise resolving to existing or newly created institution
   */
  findOrCreate(plaidInstitutionId: string, institutionName: string): Promise<Institution>;

  /**
   * Batch insert multiple institutions (used for data migration)
   * @param institutions - Array of institution data to create
   * @returns Promise resolving to array of created institutions
   * @throws {ValidationError} When any institution data is invalid
   * @throws {ConflictError} When any plaid_institution_id conflicts exist
   */
  createMany(institutions: CreateInstitutionRequest[]): Promise<Institution[]>;
}
