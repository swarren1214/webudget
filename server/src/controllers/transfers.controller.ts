// server/src/controllers/transfers.controller.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth';
import { supabase } from '../config/supabaseClient';
import { UnauthorizedError, ValidationError } from '../utils/errors';

export const getTransfersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new UnauthorizedError('User not authenticated');

    // Get all accounts for this user
    const { data: userAccounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId);

    if (accountsError) throw accountsError;

    const accountIds = userAccounts?.map((acc: any) => acc.id) || [];
    
    if (accountIds.length === 0) {
      res.status(200).json({ transfers: [] });
      return;
    }

    // Get transfers where user owns either the from or to account
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`)
      .order('date', { ascending: false });

    if (error) throw error;

    res.status(200).json({ transfers: data });
  } catch (err) {
    next(err);
  }
};

export const createTransferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new UnauthorizedError('User not authenticated');

    const { fromAccountId, toAccountId, amount, date, note } = req.body;

    // Validate required fields
    if (!fromAccountId || !toAccountId || !amount) {
      throw new ValidationError('fromAccountId, toAccountId, and amount are required');
    }

    // Verify user owns both accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .in('id', [fromAccountId, toAccountId]);

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length !== 2) {
      throw new UnauthorizedError('User does not own one or both accounts');
    }

    // Create the transfer
    const { data, error } = await supabase
      .from('transfers')
      .insert({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
        date: date || new Date().toISOString(),
        status: 'completed',
        note: note || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ transfer: data });
  } catch (err) {
    next(err);
  }
};
