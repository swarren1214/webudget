// server/src/controllers/transactions.controller.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth';
import { supabase } from '../config/supabaseClient';
import { ValidationError, UnauthorizedError } from '../utils/errors';

export const getTransactionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new UnauthorizedError('User not authenticated');

    const { account_id, start_date, end_date } = req.query;

    let query = supabase
      .from('transactions')
      .select('*, accounts!inner(*, plaid_items!inner(user_id))')
      .eq('accounts.plaid_items.user_id', userId);

    if (account_id) {
      query = query.eq('account_id', account_id as string);
    }

    if (start_date) {
      query = query.gte('date', start_date as string);
    }

    if (end_date) {
      query = query.lte('date', end_date as string);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    res.status(200).json({ transactions: data });
  } catch (err) {
    next(err);
  }
};

export const updateTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new UnauthorizedError('User not authenticated');

    const { transactionId } = req.params;
    const updateData = req.body;

    if (!transactionId) {
      throw new ValidationError('Transaction ID is required.');
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ transaction: data });
  } catch (err) {
    next(err);
  }
};