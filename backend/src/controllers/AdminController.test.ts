import { AdminController } from '../controllers/AdminController';
import { UserRole } from '../types/index';

// Mock dependencies
jest.mock('../repositories/UserRepository.js');

import UserRepository from '../repositories/UserRepository.js';

describe('AdminController', () => {
    let adminController: AdminController;
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        adminController = new AdminController();
        mockReq = {
            user: { userId: 'admin-id', email: 'admin@example.com' },
            query: {},
            params: {},
            body: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        it('should return paginated users', async () => {
            const mockUsers = {
                data: [
                    { id: '1', name: 'User 1', email: 'user1@example.com', role: UserRole.USER },
                    { id: '2', name: 'User 2', email: 'user2@example.com', role: UserRole.ADMIN },
                ],
                total: 2,
                page: 1,
                totalPages: 1,
            };

            (UserRepository.findAll as jest.Mock).mockResolvedValue(mockUsers);

            mockReq.query = { page: '1', limit: '10' };

            await adminController.getUsers(mockReq, mockRes);

            expect(UserRepository.findAll).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                search: undefined,
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockUsers,
                timestamp: expect.any(String),
            });
        });

        it('should handle search query', async () => {
            mockReq.query = { page: '1', limit: '10', search: 'john' };

            (UserRepository.findAll as jest.Mock).mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                totalPages: 0,
            });

            await adminController.getUsers(mockReq, mockRes);

            expect(UserRepository.findAll).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                search: 'john',
            });
        });
    });

    describe('getStats', () => {
        it('should return system statistics', async () => {
            const mockStats = {
                totalUsers: 100,
                totalEntries: 500,
                usersByRole: {
                    USER: 90,
                    MEDICAL_PROFESSIONAL: 8,
                    ADMIN: 2,
                },
            };

            (UserRepository.getSystemStats as jest.Mock).mockResolvedValue(mockStats);

            await adminController.getStats(mockReq, mockRes);

            expect(UserRepository.getSystemStats).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockStats,
                timestamp: expect.any(String),
            });
        });
    });

    describe('updateUserRole', () => {
        it('should update user role successfully', async () => {
            mockReq.params = { id: 'user-123' };
            mockReq.body = { role: UserRole.MEDICAL_PROFESSIONAL };

            const updatedUser = {
                id: 'user-123',
                email: 'user@example.com',
                name: 'Test User',
                role: UserRole.MEDICAL_PROFESSIONAL,
            };

            (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

            await adminController.updateUserRole(mockReq, mockRes);

            expect(UserRepository.update).toHaveBeenCalledWith('user-123', {
                role: UserRole.MEDICAL_PROFESSIONAL,
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should reject invalid role', async () => {
            mockReq.params = { id: 'user-123' };
            mockReq.body = { role: 'INVALID_ROLE' };

            await expect(adminController.updateUserRole(mockReq, mockRes)).rejects.toThrow();
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            mockReq.params = { id: 'user-123' };
            mockReq.user = { userId: 'admin-id' };

            (UserRepository.delete as jest.Mock).mockResolvedValue(undefined);

            await adminController.deleteUser(mockReq, mockRes);

            expect(UserRepository.delete).toHaveBeenCalledWith('user-123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should prevent self-deletion', async () => {
            mockReq.params = { id: 'admin-id' };
            mockReq.user = { userId: 'admin-id' };

            await expect(adminController.deleteUser(mockReq, mockRes)).rejects.toThrow();
            expect(UserRepository.delete).not.toHaveBeenCalled();
        });
    });
});
