// server/src/services/institution.service.ts

import { IInstitutionRepository } from '../repositories/interfaces/institution.repository.interface';
import { Institution, CreateInstitutionRequest, UpdateInstitutionRequest, InstitutionQuery, InstitutionListResponse } from '../types/institution';
import { ApiError, ValidationError, NotFoundError } from '../utils/errors';
import { validateRequiredString } from '../utils/validation';
import logger from '../logger';

/**
 * Institution service providing business logic for institution management.
 * Follows dependency injection pattern where repository is passed as parameter.
 */

/**
 * Get all institutions with optional filtering and pagination
 * @param query - Query parameters for filtering and pagination
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to paginated institution list
 */
export const getInstitutions = async (
  query: InstitutionQuery,
  institutionRepository: IInstitutionRepository
): Promise<InstitutionListResponse> => {
  try {
    // Validate pagination parameters
    if (query.limit !== undefined && (query.limit < 1 || query.limit > 200)) {
      throw new ValidationError('Limit must be between 1 and 200');
    }
    
    if (query.offset !== undefined && query.offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }

    const result = await institutionRepository.findMany(query);
    
    logger.info('Retrieved institutions', {
      count: result.count,
      total: result.total,
      offset: result.offset,
      query: { ...query, }
    });

    return result;
  } catch (error) {
    logger.error('Failed to retrieve institutions', { error: error instanceof Error ? error.message : error, query });
    throw error;
  }
};

/**
 * Get a single institution by ID
 * @param id - Institution ID
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to institution or null if not found
 */
export const getInstitutionById = async (
  id: string,
  institutionRepository: IInstitutionRepository
): Promise<Institution> => {
  try {
    validateRequiredString(id, 'Institution ID');
    validateUUID(id);

    const institution = await institutionRepository.findById(id);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${id} not found`);
    }

    logger.info('Retrieved institution by ID', { id, institutionName: institution.name });
    return institution;
  } catch (error) {
    logger.error('Failed to retrieve institution by ID', { error: error instanceof Error ? error.message : error, id });
    throw error;
  }
};

/**
 * Get a single institution by Plaid institution ID
 * @param plaidInstitutionId - Plaid institution ID
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to institution or null if not found
 */
export const getInstitutionByPlaidId = async (
  plaidInstitutionId: string,
  institutionRepository: IInstitutionRepository
): Promise<Institution> => {
  try {
    validateRequiredString(plaidInstitutionId, 'Plaid institution ID');

    const institution = await institutionRepository.findByPlaidId(plaidInstitutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with Plaid ID ${plaidInstitutionId} not found`);
    }

    logger.info('Retrieved institution by Plaid ID', { plaidInstitutionId, institutionName: institution.name });
    return institution;
  } catch (error) {
    logger.error('Failed to retrieve institution by Plaid ID', { error: error instanceof Error ? error.message : error, plaidInstitutionId });
    throw error;
  }
};

/**
 * Create a new institution
 * @param institutionData - Institution data to create
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to created institution
 */
export const createInstitution = async (
  institutionData: CreateInstitutionRequest,
  institutionRepository: IInstitutionRepository
): Promise<Institution> => {
  try {
    validateCreateInstitutionRequest(institutionData);

    // Check if institution with this Plaid ID already exists
    const existingInstitution = await institutionRepository.findByPlaidId(institutionData.plaid_institution_id);
    if (existingInstitution) {
      throw new ValidationError(`Institution with Plaid ID ${institutionData.plaid_institution_id} already exists`);
    }

    const institution = await institutionRepository.create(institutionData);
    
    logger.info('Created new institution', {
      id: institution.id,
      plaidInstitutionId: institution.plaid_institution_id,
      name: institution.name
    });

    return institution;
  } catch (error) {
    logger.error('Failed to create institution', { error: error instanceof Error ? error.message : error, institutionData });
    throw error;
  }
};

/**
 * Update an existing institution
 * @param id - Institution ID
 * @param updateData - Institution data to update
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to updated institution
 */
export const updateInstitution = async (
  id: string,
  updateData: UpdateInstitutionRequest,
  institutionRepository: IInstitutionRepository
): Promise<Institution> => {
  try {
    validateRequiredString(id, 'Institution ID');
    validateUUID(id);
    validateUpdateInstitutionRequest(updateData);

    const institution = await institutionRepository.update(id, updateData);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${id} not found`);
    }

    logger.info('Updated institution', { id, updateData });
    return institution;
  } catch (error) {
    logger.error('Failed to update institution', { error: error instanceof Error ? error.message : error, id, updateData });
    throw error;
  }
};

/**
 * Delete an institution
 * @param id - Institution ID
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to true if deleted
 */
export const deleteInstitution = async (
  id: string,
  institutionRepository: IInstitutionRepository
): Promise<void> => {
  try {
    validateRequiredString(id, 'Institution ID');
    validateUUID(id);

    const deleted = await institutionRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Institution with ID ${id} not found`);
    }

    logger.info('Deleted institution', { id });
  } catch (error) {
    logger.error('Failed to delete institution', { error: error instanceof Error ? error.message : error, id });
    throw error;
  }
};

/**
 * Find or create an institution based on Plaid data
 * Used during plaid_items creation to ensure institution exists
 * @param plaidInstitutionId - Plaid institution ID
 * @param institutionName - Institution name from Plaid
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to existing or newly created institution
 */
export const findOrCreateInstitution = async (
  plaidInstitutionId: string,
  institutionName: string,
  institutionRepository: IInstitutionRepository
): Promise<Institution> => {
  try {
    validateRequiredString(plaidInstitutionId, 'Plaid institution ID');
    validateRequiredString(institutionName, 'Institution name');

    const institution = await institutionRepository.findOrCreate(plaidInstitutionId, institutionName);
    
    logger.info('Found or created institution', {
      id: institution.id,
      plaidInstitutionId: institution.plaid_institution_id,
      name: institution.name
    });

    return institution;
  } catch (error) {
    logger.error('Failed to find or create institution', { error: error instanceof Error ? error.message : error, plaidInstitutionId, institutionName });
    throw error;
  }
};

/**
 * Get institution count
 * @param institutionRepository - Institution repository instance
 * @returns Promise resolving to total institution count
 */
export const getInstitutionCount = async (
  institutionRepository: IInstitutionRepository
): Promise<number> => {
  try {
    const count = await institutionRepository.count();
    logger.info('Retrieved institution count', { count });
    return count;
  } catch (error) {
    logger.error('Failed to retrieve institution count', { error: error instanceof Error ? error.message : error });
    throw error;
  }
};

/**
 * Validation helpers
 */

const validateCreateInstitutionRequest = (data: CreateInstitutionRequest): void => {
  validateRequiredString(data.plaid_institution_id, 'Plaid institution ID');
  validateRequiredString(data.name, 'Institution name');

  if (data.logo_url && !isValidUrl(data.logo_url)) {
    throw new ValidationError('Logo URL must be a valid URL');
  }

  if (data.url && !isValidUrl(data.url)) {
    throw new ValidationError('Institution URL must be a valid URL');
  }

  if (data.primary_color && !isValidHexColor(data.primary_color)) {
    throw new ValidationError('Primary color must be a valid hex color (e.g., #FF0000)');
  }
};

const validateUpdateInstitutionRequest = (data: UpdateInstitutionRequest): void => {
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new ValidationError('Institution name cannot be empty');
    }
  }

  if (data.logo_url !== undefined && data.logo_url !== null && !isValidUrl(data.logo_url)) {
    throw new ValidationError('Logo URL must be a valid URL');
  }

  if (data.url !== undefined && data.url !== null && !isValidUrl(data.url)) {
    throw new ValidationError('Institution URL must be a valid URL');
  }

  if (data.primary_color !== undefined && data.primary_color !== null && !isValidHexColor(data.primary_color)) {
    throw new ValidationError('Primary color must be a valid hex color (e.g., #FF0000)');
  }
};

const validateUUID = (id: string): void => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('ID must be a valid UUID format');
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};