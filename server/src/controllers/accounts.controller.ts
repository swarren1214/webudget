// server/src/controllers/accounts.controller.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth';
import { DependencyContainer } from '../config/dependencies';
import { supabase } from '../config/supabaseClient';

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
    res.status(200).json([]);
  } catch (err) {
    next(err);
  }
};

export const createAccountHandler = async (
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

    const { name, type, balance, institutionName, accountNumber } = req.body;
    
    console.log('[H1_DEBUG] Creating account:', { userId, name, type, balance, institutionName, accountNumber });

    // Insert account into Supabase - using snake_case for DB columns
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name: name || 'New Account',
        type: type || 'checking',
        balance: balance || 0,
        institution_name: institutionName || 'Pending',
        account_number: accountNumber || 'Pending',
        is_connected: false
      })
      .select()
      .single();

    if (error) {
      console.error('[H1_ERROR] Failed to create account:', error);
      res.status(400).json({ error: error.message });
      return;
    }

    console.log('[H1_DEBUG] Account created successfully:', data);
    res.status(201).json(data);
  } catch (err) {
    console.error('[H1_ERROR] Exception in createAccountHandler:', err);
    next(err);
  }
};