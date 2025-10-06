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
    console.log('[H1_DEBUG] exchangePublicTokenHandler called', { timestamp: new Date().toISOString() });
    
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      console.error('[H1_ERROR] User not authenticated');
      throw new UnauthorizedError('User not authenticated');
    }
    console.log('[H1_DEBUG] User authenticated:', { userId });

    const { publicToken, accountId } = req.body;
    console.log('[H1_DEBUG] Request body:', { hasPublicToken: !!publicToken, accountId });
    
    if (!publicToken) {
      console.error('[H1_ERROR] publicToken is missing');
      throw new ValidationError('publicToken is required');
    }

    if (!accountId) {
      console.error('[H1_ERROR] accountId is missing');
      throw new ValidationError('accountId is required');
    }

    console.log('[H1_DEBUG] Inserting Plaid item into Supabase');
    // Insert Plaid item into Supabase
    const newItem = await supabase
      .from('plaid_items')
      .insert({ user_id: userId, public_token: publicToken })
      .select();

    console.log('[H1_DEBUG] Supabase insert result:', { 
      hasError: !!newItem.error, 
      hasData: !!newItem.data,
      dataLength: newItem.data?.length,
      error: newItem.error?.message 
    });

    if (newItem.error || !newItem.data || newItem.data.length === 0) {
      const errorMsg = `Failed to insert Plaid item: ${newItem.error?.message ?? 'No data returned'}`;
      console.error('[H1_ERROR]', errorMsg);
      throw new Error(errorMsg);
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

    console.log('[H1_DEBUG] Exchange complete, returning 202 response');
    res.status(202).json({ newItem, institution });
  } catch (error) {
    console.error('[H1_ERROR] Exception in exchangePublicTokenHandler:', error);
    next(error);
  }
};