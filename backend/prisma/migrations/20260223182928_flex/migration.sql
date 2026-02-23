-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "contentIv" TEXT,
ADD COLUMN     "contentTag" TEXT,
ADD COLUMN     "encryptionVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "titleIv" TEXT,
ADD COLUMN     "titleTag" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "entry_insights" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "summaryIv" TEXT,
    "summaryTag" TEXT,
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entry_insights_entryId_key" ON "entry_insights"("entryId");

-- CreateIndex
CREATE INDEX "entry_insights_userId_idx" ON "entry_insights"("userId");

-- AddForeignKey
ALTER TABLE "entry_insights" ADD CONSTRAINT "entry_insights_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_insights" ADD CONSTRAINT "entry_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
