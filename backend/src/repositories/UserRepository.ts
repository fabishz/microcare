import { PrismaClient } from '@prisma/client';
import { User, UserRole } from '../types/index.js';

/**
 * UserRepository
 * Handles all database operations related to users
 */

const prisma = new PrismaClient();

export class UserRepository {
  /**
   * Find a user by ID
   * @param id - The user's ID
   * @returns The user if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user as User | null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a user by email
   * @param email - The user's email
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user as User | null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new user
   * @param email - The user's email
   * @param name - The user's name
   * @param passwordHash - The hashed password
   * @returns The created user
   */
  async create(email: string, name: string, passwordHash: string): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });
      return user as User;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a user
   * @param id - The user's ID
   * @param data - The data to update
   * @returns The updated user
   */
  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      hasCompletedOnboarding?: boolean;
      role?: UserRole;
    }
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
      });
      return user as User;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all users with pagination and search
   */
  async findAll(options: { page: number; limit: number; search?: string }): Promise<any> {
    try {
      const skip = (options.page - 1) * options.limit;
      const where = options.search
        ? {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' as const } },
            { email: { contains: options.search, mode: 'insensitive' as const } },
          ],
        }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: options.limit,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            hasCompletedOnboarding: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        data: users,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<any> {
    try {
      const [totalUsers, totalEntries, usersByRole] = await Promise.all([
        prisma.user.count(),
        prisma.journalEntry.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      return {
        totalUsers,
        totalEntries,
        usersByRole: usersByRole.reduce((acc: any, item: any) => {
          acc[item.role] = item._count;
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new Error(`Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Increment failed login attempts for a user
   */
  async incrementFailedLoginAttempts(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to increment failed login attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset failed login attempts for a user
   */
  async resetFailedLoginAttempts(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    } catch (error) {
      throw new Error(`Failed to reset failed login attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lock a user account until a specific time
   */
  async lockAccount(id: string, lockoutUntil: Date): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          lockoutUntil,
        },
      });
    } catch (error) {
      throw new Error(`Failed to lock account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default new UserRepository();
