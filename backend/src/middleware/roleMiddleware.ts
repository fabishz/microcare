import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';
import { AuthorizationError } from '../utils/errors.js';
import { UserRole } from '../types/index.js';

/**
 * Role-based access control middleware
 * Checks if the authenticated user has one of the required roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new AuthorizationError('Authentication required');
            }

            // Get user role from database (req.user only has userId and email from JWT)
            const { default: UserRepository } = await import('../repositories/UserRepository.js');
            const user = await UserRepository.findById(req.user.userId);

            if (!user) {
                throw new AuthorizationError('User not found');
            }

            if (!allowedRoles.includes(user.role as UserRole)) {
                throw new AuthorizationError(
                    `Access denied. Required role: ${allowedRoles.join(' or ')}`
                );
            }

            // Attach full user to request for downstream use
            req.user = {
                ...req.user,
                role: user.role as UserRole,
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware to require medical professional or admin role
 */
export const requireMedicalOrAdmin = requireRole(
    UserRole.MEDICAL_PROFESSIONAL,
    UserRole.ADMIN
);
