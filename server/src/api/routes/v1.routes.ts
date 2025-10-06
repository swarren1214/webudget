// server/src/api/routes/v1.routes.ts

import { Router, Request, Response } from 'express';

import plaidRouter from './plaid.routes';
import institutionRouter from './institution.routes';
import transactionsRouter from './transactions.routes';
import accountsRouter from './accounts.routes';
import transfersRouter from './transfers.routes';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { supabase } from '../../config/supabaseClient';

const router = Router();

// Test route for the V1 API
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the WeBudget API v1' });
});

// Mount the route modules
router.use('/plaid', plaidRouter);
router.use('/institutions', institutionRouter);
router.use('/transactions', transactionsRouter);
router.use('/accounts', accountsRouter);
router.use('/transfers', transfersRouter);

// Route to fetch all budget categories
router.get('/budget-categories', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const budgetCategories = await supabase
    .from('budget_categories')
    .select('*');

  if (budgetCategories.error) {
    throw new Error(budgetCategories.error.message);
  }

  res.status(200).json(budgetCategories.data);
}));

export default router;