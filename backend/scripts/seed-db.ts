import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Seed database with test data
 * This script is optional and used for development/testing purposes
 */
async function seedDatabase(): Promise<void> {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  MicroCare Database Seeding');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Creating test users...');

    // Create test user 1
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const user1 = await prisma.user.create({
      data: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        passwordHash: hashedPassword1,
      },
    });
    console.log(`✓ Created user: ${user1.email}`);

    // Create test user 2
    const hashedPassword2 = await bcrypt.hash('password456', 10);
    const user2 = await prisma.user.create({
      data: {
        email: 'bob@example.com',
        name: 'Bob Smith',
        passwordHash: hashedPassword2,
      },
    });
    console.log(`✓ Created user: ${user2.email}`);

    console.log('\nCreating sample journal entries...');

    // Create entries for user 1
    const entry1 = await prisma.journalEntry.create({
      data: {
        userId: user1.id,
        title: 'My First Day',
        content: 'Today was a great day! I started my new journaling journey and I\'m excited about the possibilities.',
        mood: 'happy',
        tags: ['first-entry', 'excited', 'new-beginning'],
      },
    });
    console.log(`✓ Created entry: "${entry1.title}"`);

    const entry2 = await prisma.journalEntry.create({
      data: {
        userId: user1.id,
        title: 'Reflections on Growth',
        content: 'I\'ve been thinking about my personal growth lately. It\'s important to take time to reflect on how far I\'ve come.',
        mood: 'thoughtful',
        tags: ['reflection', 'growth', 'personal-development'],
      },
    });
    console.log(`✓ Created entry: "${entry2.title}"`);

    const entry3 = await prisma.journalEntry.create({
      data: {
        userId: user1.id,
        title: 'Gratitude Practice',
        content: 'Today I\'m grateful for my family, my health, and the opportunities I have. Gratitude is a powerful practice.',
        mood: 'grateful',
        tags: ['gratitude', 'mindfulness', 'wellness'],
      },
    });
    console.log(`✓ Created entry: "${entry3.title}"`);

    // Create entries for user 2
    const entry4 = await prisma.journalEntry.create({
      data: {
        userId: user2.id,
        title: 'Starting Fresh',
        content: 'Today marks a new beginning. I\'m committed to taking care of my mental health and well-being.',
        mood: 'hopeful',
        tags: ['new-start', 'commitment', 'wellness'],
      },
    });
    console.log(`✓ Created entry: "${entry4.title}"`);

    const entry5 = await prisma.journalEntry.create({
      data: {
        userId: user2.id,
        title: 'Challenges and Victories',
        content: 'Today was challenging, but I overcame it. Every challenge is an opportunity to grow stronger.',
        mood: 'determined',
        tags: ['challenges', 'resilience', 'growth'],
      },
    });
    console.log(`✓ Created entry: "${entry5.title}"`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✓ Database seeding completed successfully');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Test Credentials:');
    console.log('  User 1:');
    console.log('    Email: alice@example.com');
    console.log('    Password: password123');
    console.log('  User 2:');
    console.log('    Email: bob@example.com');
    console.log('    Password: password456\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if error is due to unique constraint (user already exists)
    if (errorMessage.includes('Unique constraint failed')) {
      console.warn('\n⚠ Warning: Some test users already exist in the database');
      console.warn('Skipping seed operation to avoid duplicates\n');
      return;
    }

    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('✗ Database seeding failed');
    console.error('═══════════════════════════════════════════════════════════\n');
    console.error('Error details:', errorMessage);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
