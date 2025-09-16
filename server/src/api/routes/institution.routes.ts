// server/src/api/routes/institution.routes.ts

import { Router, RequestHandler } from 'express';
import {
    getInstitutionsHandler,
    getInstitutionHandler,
    getInstitutionByPlaidIdHandler,
    createInstitutionHandler,
    updateInstitutionHandler,
    deleteInstitutionHandler,
    getInstitutionCountHandler
} from '../../controllers/institution.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AuthRequest } from '@/types/auth';

const router = Router();

// Adjust middleware to ensure compatibility with typings
router.use(((req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    authMiddleware(authReq, res, next);
}) as RequestHandler);

// Wrap handlers in properly typed RequestHandler
const getInstitutionsHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await getInstitutionsHandler(authReq, res, next);
};

const getInstitutionHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await getInstitutionHandler(authReq, res, next);
};

const getInstitutionByPlaidIdHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await getInstitutionByPlaidIdHandler(authReq, res, next);
};

const createInstitutionHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await createInstitutionHandler(authReq, res, next);
};

const updateInstitutionHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await updateInstitutionHandler(authReq, res, next);
};

const deleteInstitutionHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await deleteInstitutionHandler(authReq, res, next);
};

const getInstitutionCountHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await getInstitutionCountHandler(authReq, res, next);
};

// Adjust asyncHandler usage to resolve type compatibility issues
const asyncHandlerWrapper = (handler: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

// Institution CRUD routes
router.get(
    '/',
    asyncHandlerWrapper(getInstitutionsHandlerWrapper)
);

router.get(
    '/stats/count',
    asyncHandlerWrapper(getInstitutionCountHandlerWrapper)
);

router.get(
    '/plaid/:plaidId',
    asyncHandlerWrapper(getInstitutionByPlaidIdHandlerWrapper)
);

router.get(
    '/:id',
    asyncHandlerWrapper(getInstitutionHandlerWrapper)
);

router.post(
    '/',
    asyncHandlerWrapper(createInstitutionHandlerWrapper)
);

router.put(
    '/:id',
    asyncHandlerWrapper(updateInstitutionHandlerWrapper)
);

router.delete(
    '/:id',
    asyncHandlerWrapper(deleteInstitutionHandlerWrapper)
);

export default router;
