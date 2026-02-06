import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/password';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test users...');

    // Admin User
    const adminEmail = 'admin@microcare.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const passwordHash = await hashPassword('AdminPass123!');
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Admin User',
                passwordHash,
                role: 'ADMIN',
                hasCompletedOnboarding: true,
            },
        });
        console.log('Created Admin User: admin@microcare.com / AdminPass123!');
    } else {
        console.log('Admin user already exists');
    }

    // Medical Professional User
    const medicalEmail = 'doctor@microcare.com';
    const existingMedical = await prisma.user.findUnique({ where: { email: medicalEmail } });
    if (!existingMedical) {
        const passwordHash = await hashPassword('DoctorPass123!');
        await prisma.user.create({
            data: {
                email: medicalEmail,
                name: 'Dr. Smith',
                passwordHash,
                role: 'MEDICAL_PROFESSIONAL',
                hasCompletedOnboarding: true,
            },
        });
        console.log('Created Medical User: doctor@microcare.com / DoctorPass123!');
    } else {
        console.log('Medical user already exists');
    }

    // Regular User
    const userEmail = 'user@microcare.com';
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!existingUser) {
        const passwordHash = await hashPassword('UserPass123!');
        await prisma.user.create({
            data: {
                email: userEmail,
                name: 'Regular User',
                passwordHash,
                role: 'USER',
                hasCompletedOnboarding: true,
            },
        });
        console.log('Created Regular User: user@microcare.com / UserPass123!');
    } else {
        console.log('Regular user already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
