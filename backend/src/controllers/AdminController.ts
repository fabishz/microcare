import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
    ApiError,
    ValidationError,
} from '../utils/errors.js';
import UserRepository from '../repositories/UserRepository.js';
import { UserRole } from '../types/index.js';

/**
 * AdminController
 * Handles HTTP requests for admin-only endpoints
 */

export class AdminController {
    /**
     * Get all users (paginated)
     * GET /api/admin/users
     */
    async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string;

            const users = await UserRepository.findAll({ page, limit, search });

            res.status(200).json({
                success: true,
                data: users,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch users', 'USERS_FETCH_FAILED');
        }
    }

    /**
     * Get system statistics
     * GET /api/admin/stats
     */
    async getStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const stats = await UserRepository.getSystemStats();

            res.status(200).json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch stats', 'STATS_FETCH_FAILED');
        }
    }

    /**
     * Update user role
     * PUT /api/admin/users/:id/role
     */
    async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!role || !Object.values(UserRole).includes(role)) {
                throw new ValidationError('Invalid role', { role: 'Must be USER, MEDICAL_PROFESSIONAL, or ADMIN' });
            }

            const updatedUser = await UserRepository.update(id, { role });

            res.status(200).json({
                success: true,
                data: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    role: updatedUser.role,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to update user role', 'ROLE_UPDATE_FAILED');
        }
    }

    /**
     * Delete user
     * DELETE /api/admin/users/:id
     */
    async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Prevent self-deletion
            if (req.user?.userId === id) {
                throw new ValidationError('Cannot delete your own account');
            }

            await UserRepository.delete(id);

            res.status(200).json({
                success: true,
                data: { message: 'User deleted successfully' },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to delete user', 'USER_DELETE_FAILED');
        }
    }
}

export default new AdminController();
