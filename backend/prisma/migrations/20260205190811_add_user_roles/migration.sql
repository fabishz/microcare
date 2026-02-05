-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MEDICAL_PROFESSIONAL', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
