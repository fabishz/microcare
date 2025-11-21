import { PrismaClient } from '@prisma/client';
import { User } from '../types/index.js';

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
}

export default new UserRepository();
