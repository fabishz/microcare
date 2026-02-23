import { PrismaClient } from '@prisma/client';
import { decryptText, encryptText, isEncryptedPayload } from '../utils/encryption.js';

const prisma = new PrismaClient();

export interface EntryInsightRecord {
  entryId: string;
  summary: string;
  themes: string[];
}

export class InsightRepository {
  async upsertInsight(entryId: string, userId: string, summary: string, themes: string[]): Promise<void> {
    const encryptedSummary = encryptText(summary);
    await prisma.entryInsight.upsert({
      where: { entryId },
      update: {
        summary: encryptedSummary.cipherText,
        summaryIv: encryptedSummary.iv,
        summaryTag: encryptedSummary.tag,
        themes,
      },
      create: {
        entryId,
        userId,
        summary: encryptedSummary.cipherText,
        summaryIv: encryptedSummary.iv,
        summaryTag: encryptedSummary.tag,
        themes,
      },
    });
  }

  async findByEntryId(entryId: string): Promise<EntryInsightRecord | null> {
    const insight = await prisma.entryInsight.findUnique({
      where: { entryId },
      select: { entryId: true, summary: true, themes: true, summaryIv: true, summaryTag: true },
    });
    if (!insight) {
      return null;
    }

    return {
      entryId: insight.entryId,
      summary: this.decryptSummaryIfNeeded(insight),
      themes: insight.themes,
    };
  }

  async findByEntryIds(entryIds: string[]): Promise<EntryInsightRecord[]> {
    if (entryIds.length === 0) {
      return [];
    }
    const insights = await prisma.entryInsight.findMany({
      where: { entryId: { in: entryIds } },
      select: { entryId: true, summary: true, themes: true, summaryIv: true, summaryTag: true },
    });
    return insights.map((insight) => ({
      entryId: insight.entryId,
      summary: this.decryptSummaryIfNeeded(insight),
      themes: insight.themes,
    }));
  }

  async findByUserId(userId: string, limit: number = 20): Promise<EntryInsightRecord[]> {
    const insights = await prisma.entryInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { entryId: true, summary: true, themes: true, summaryIv: true, summaryTag: true },
    });
    return insights.map((insight) => ({
      entryId: insight.entryId,
      summary: this.decryptSummaryIfNeeded(insight),
      themes: insight.themes,
    }));
  }

  private decryptSummaryIfNeeded(insight: {
    summary: string;
    summaryIv?: string | null;
    summaryTag?: string | null;
  }): string {
    if (isEncryptedPayload({ iv: insight.summaryIv, tag: insight.summaryTag })) {
      return decryptText({
        cipherText: insight.summary,
        iv: insight.summaryIv,
        tag: insight.summaryTag,
      });
    }
    return insight.summary;
  }
}

export default new InsightRepository();
