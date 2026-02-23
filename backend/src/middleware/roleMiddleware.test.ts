import { Response, NextFunction } from 'express';
import { requireRole, requireAdmin, requireMedicalOrAdmin } from '../middleware/roleMiddleware';
import { UserRole } from '../types/index';
import { AuthorizationError } from '../utils/errors';

// Mock UserRepository
jest.mock('../repositories/UserRepository.js');

import UserRepository from '../repositories/UserRepository.js';

describe('Role Middleware', () => {
    let mockReq: any;
    let mockRes: Response;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            user: {
                userId: 'test-user-id',
                email: 'test@example.com',
            },
        };
        mockRes = {} as Response;
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('requireRole', () => {
        it('should allow access when user has required role', async () => {
            const middleware = requireRole(UserRole.ADMIN);

            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.ADMIN,
                passwordHash: 'hash',
                hasCompletedOnboarding: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockReq.user.role).toBe(UserRole.ADMIN);
        });

        it('should deny access when user has wrong role', async () => {
            const middleware = requireRole(UserRole.ADMIN);

            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.USER,
                passwordHash: 'hash',
                hasCompletedOnboarding: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
        });

        it('should deny access when user is not authenticated', async () => {
            const middleware = requireRole(UserRole.ADMIN);
            mockReq.user = null;

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
        });

        it('should allow access when user has one of multiple allowed roles', async () => {
            const middleware = requireRole(UserRole.ADMIN, UserRole.MEDICAL_PROFESSIONAL);

            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.MEDICAL_PROFESSIONAL,
                passwordHash: 'hash',
                hasCompletedOnboarding: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockReq.user.role).toBe(UserRole.MEDICAL_PROFESSIONAL);
        });
    });

    describe('requireAdmin', () => {
        it('should allow access for admin users', async () => {
            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                role: UserRole.ADMIN,
            });

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should deny access for non-admin users', async () => {
            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                role: UserRole.USER,
            });

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
        });
    });

    describe('requireMedicalOrAdmin', () => {
        it('should allow access for medical professionals', async () => {
            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                role: UserRole.MEDICAL_PROFESSIONAL,
            });

            await requireMedicalOrAdmin(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should allow access for admins', async () => {
            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                role: UserRole.ADMIN,
            });

            await requireMedicalOrAdmin(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should deny access for regular users', async () => {
            (UserRepository.findById as jest.Mock).mockResolvedValue({
                id: 'test-user-id',
                role: UserRole.USER,
            });

            await requireMedicalOrAdmin(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
        });
    });
});
