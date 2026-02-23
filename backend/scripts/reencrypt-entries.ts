import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { encryptText, isEncryptedPayload } from '../src/utils/encryption.js';

dotenv.config();

const prisma = new PrismaClient();

async function reencryptEntries(): Promise<void> {
  const entries = await prisma.journalEntry.findMany();

  for (const entry of entries) {
    const needsTitle = !isEncryptedPayload({ iv: entry.titleIv, tag: entry.titleTag });
    const needsContent = !isEncryptedPayload({ iv: entry.contentIv, tag: entry.contentTag });

    if (!needsTitle && !needsContent) {
      continue;
    }

    const updates: Record<string, string> = {};

    if (needsTitle) {
      const encryptedTitle = encryptText(entry.title);
      updates.title = encryptedTitle.cipherText;
      updates.titleIv = encryptedTitle.iv;
      updates.titleTag = encryptedTitle.tag;
    }

    if (needsContent) {
      const encryptedContent = encryptText(entry.content);
      updates.content = encryptedContent.cipherText;
      updates.contentIv = encryptedContent.iv;
      updates.contentTag = encryptedContent.tag;
    }

    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: updates,
    });
  }
}

reencryptEntries()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Re-encryption complete.');
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    console.error('Re-encryption failed:', error);
    process.exit(1);
  });
