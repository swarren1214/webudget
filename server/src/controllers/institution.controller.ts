// server/src/controllers/institution.controller.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DependencyContainer } from '../config/dependencies';
import { 
  getInstitutions, 
  getInstitutionById, 
  getInstitutionByPlaidId,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getInstitutionCount
} from '../services/institution.service';
import { InstitutionQuery, CreateInstitutionRequest, UpdateInstitutionRequest } from '../types/institution';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../logger';

const container = DependencyContainer.getInstance();

/**
 * GET /api/v1/institutions
 * Get all institutions with optional filtering and pagination
 */
export const getInstitutionsHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const query: InstitutionQuery = {
            plaid_institution_id: req.query.plaid_institution_id as string,
            name: req.query.name as string,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        const institutionRepository = container.getInstitutionRepository();
        const result = await getInstitutions(query, institutionRepository);

        res.status(200).json({
            data: result.institutions,
            total: result.total,
            count: result.count,
            offset: result.offset
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/institutions/:id
 * Get a single institution by ID
 */
export const getInstitutionHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        
        const institutionRepository = container.getInstitutionRepository();
        const institution = await getInstitutionById(id, institutionRepository);

        res.status(200).json({ data: institution });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/institutions/plaid/:plaidId
 * Get a single institution by Plaid institution ID
 */
export const getInstitutionByPlaidIdHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { plaidId } = req.params;
        
        const institutionRepository = container.getInstitutionRepository();
        const institution = await getInstitutionByPlaidId(plaidId, institutionRepository);

        res.status(200).json({ data: institution });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/institutions
 * Create a new institution
 */
export const createInstitutionHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const institutionData: CreateInstitutionRequest = req.body;
        
        const institutionRepository = container.getInstitutionRepository();
        const institution = await createInstitution(institutionData, institutionRepository);

        res.status(201).json({ 
            data: institution,
            message: 'Institution created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/institutions/:id
 * Update an existing institution
 */
export const updateInstitutionHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData: UpdateInstitutionRequest = req.body;
        
        const institutionRepository = container.getInstitutionRepository();
        const institution = await updateInstitution(id, updateData, institutionRepository);

        res.status(200).json({ 
            data: institution,
            message: 'Institution updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/institutions/:id
 * Delete an institution
 */
export const deleteInstitutionHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        
        const institutionRepository = container.getInstitutionRepository();
        await deleteInstitution(id, institutionRepository);

        res.status(200).json({
            message: 'Institution deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/institutions/stats/count
 * Get total institution count
 */
export const getInstitutionCountHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const institutionRepository = container.getInstitutionRepository();
        const count = await getInstitutionCount(institutionRepository);

        res.status(200).json({ count });
    } catch (error) {
        next(error);
    }
};
