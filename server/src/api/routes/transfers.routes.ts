// server/src/api/routes/transfers.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { getTransfersHandler, createTransferHandler } from '../../controllers/transfers.controller';

const router = Router();

// All transfers routes require authentication
router.use(authMiddleware);

// GET /api/v1/transfers - Get all transfers for the authenticated user
router.get('/', asyncHandler(getTransfersHandler));

// POST /api/v1/transfers - Create a new transfer
router.post('/', asyncHandler(createTransferHandler));

export default router;
