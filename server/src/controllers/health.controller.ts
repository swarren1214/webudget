// server/src/controllers/health.controller.ts

import { Request, Response, NextFunction } from 'express';
import { checkHealth } from '../services/health.service';
import { DependencyContainer } from '../config/dependencies';

const container = DependencyContainer.getInstance();

export const getHealthStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Create a check function that uses our repositories
        const checkDbConnection = async () => {
            const institutionRepository = container.getInstitutionRepository();
            // Simple database check using institution count
            await institutionRepository.count();
        };

        const healthStatus = await checkHealth(checkDbConnection);

        if (healthStatus.status === 'OK') {
            res.status(200).json(healthStatus);
        } else {
            res.status(503).json(healthStatus);
        }
    } catch (error) {
        next(error);
    }
};
