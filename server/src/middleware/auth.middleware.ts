// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { UnauthorizedError } from '../utils/errors';
import config from '../config/env';

interface SupabaseJwtPayload {
    sub: string;
    email?: string;
    aud?: string;
    role?: string;
    iat?: number;
    exp?: number;
}

// Extend the Express Request type properly
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
    };
}

// Create a remote JWKS for Supabase
const JWKS = createRemoteJWKSet(new URL('https://lwnkjhtiljspretoxrru.supabase.co/auth/v1/keys'));

// Main authentication middleware using Supabase JWT
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedError('Authorization header is required.');
        }

        if (!authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authorization header must start with "Bearer".');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedError('Token is required.');
        }

        // Check JWT algorithm to determine verification method
        let tokenAlgorithm = 'unknown';
        try {
            const headerPart = token.split('.')[0];
            const decodedHeader = JSON.parse(Buffer.from(headerPart, 'base64').toString());
            tokenAlgorithm = decodedHeader.alg;
            
            // Use symmetric verification for HS256 tokens
            if (tokenAlgorithm === 'HS256') {
                const jwt = require('jsonwebtoken');
                const payload = jwt.verify(token, config.SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
                
                // Attach user info to the request
                const authReq = req as AuthRequest;
                authReq.user = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                };

                return next();
            }
        } catch (decodeError) {
            console.error(`[${requestId}] Failed to decode JWT header:`, decodeError);
        }

        // Fallback to JWKS verification for asymmetric algorithms
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: 'https://lwnkjhtiljspretoxrru.supabase.co/auth/v1',
        });

        // Attach user info to the request
        const authReq = req as AuthRequest;
        authReq.user = {
            id: payload.sub as string,
            email: payload.email as string,
            role: payload.role as string,
        };

        next();
    } catch (error) {
        console.error(`[${requestId}] JWT verification failed:`, error instanceof Error ? error.message : error);

        if (error instanceof UnauthorizedError) {
            next(error);
            return;
        }

        next(new UnauthorizedError('Token verification failed.'));  
    }
};