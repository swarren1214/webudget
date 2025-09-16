// server/src/controllers/plaid.controller.ts

import { Request, Response, NextFunction } from 'express';
import {
  createLinkToken,
  exchangePublicToken,
  PlaidTokenExchangeContext,
  ExchangeTokenRequest,
} from '../services/plaid.service';
import { DependencyContainer } from '../config/dependencies';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabase } from '../config/supabaseClient';

// Get dependencies
const container = DependencyContainer.getInstance();
const plaidWrappers = container.getPlaidClientWrappers();
const { encrypt } = container.getCryptoUtils();
const unitOfWork = container.createUnitOfWork();

type PlaidItem = {
  id: string;
  user_id: string;
  public_token: string;
  institution_id?: string;
};

export const createLinkTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const tokenData = await createLinkToken(userId, plaidWrappers.linkTokenCreate);
    res.status(200).json(tokenData);
  } catch (error) {
    next(error);
  }
};

export const exchangePublicTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { publicToken, accountId } = req.body;
    if (!publicToken) {
      throw new ValidationError('publicToken is required');
    }

    if (!accountId) {
      throw new ValidationError('accountId is required');
    }

    // Insert Plaid item into Supabase
    const newItem = await supabase
      .from('plaid_items')
      .insert({ user_id: userId, public_token: publicToken })
      .select();

    if (newItem.error || !newItem.data || newItem.data.length === 0) {
      throw new Error(`Failed to insert Plaid item: ${newItem.error?.message ?? 'No data returned'}`);
    }

    const institutionId = newItem.data[0]?.institution_id;

    const institution = institutionId
      ? await supabase
          .from('institutions')
          .select('*')
          .eq('user_id', userId)
          .eq('id', institutionId)
          .maybeSingle()
      : null;

    res.status(202).json({ newItem, institution });
  } catch (error) {
    next(error);
  }
};