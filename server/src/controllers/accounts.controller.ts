// server/src/controllers/accounts.controller.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth';
import { DependencyContainer } from '../config/dependencies';

const container = DependencyContainer.getInstance();

export const getAccountsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // TODO: Implement accounts service and repository
    // For now, return empty array since institutions table doesn't exist yet
    // This will be implemented once institutions table is created and populated
    res.status(200).json({ accounts: [] });
  } catch (err) {
    next(err);
  }
};