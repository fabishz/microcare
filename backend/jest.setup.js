// Jest setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/microcare_test';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mLQf1o0oW+V9n4c9y9j+N9fQmB5+W1VY3H1m2K4y6t8=';

// Suppress console output during tests (optional)
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});
