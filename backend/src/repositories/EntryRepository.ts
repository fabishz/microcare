import { PrismaClient } from '@prisma/client';
import { JournalEntry, PaginatedResponse } from '../types/index.js';
import { decryptText, encryptText, isEncryptedPayload } from '../utils/encryption.js';

/**
 * EntryRepository
 * Handles all database operations related to journal entries
 */

const prisma = new PrismaClient();

export class EntryRepository {
  private async decryptEntry(entry: any): Promise<JournalEntry> {
    const titleIsEncrypted = isEncryptedPayload({ iv: entry.titleIv, tag: entry.titleTag });
    const contentIsEncrypted = isEncryptedPayload({ iv: entry.contentIv, tag: entry.contentTag });

    let decryptedTitle = entry.title;
    let decryptedContent = entry.content;

    if (titleIsEncrypted) {
      decryptedTitle = decryptText({
        cipherText: entry.title,
        iv: entry.titleIv,
        tag: entry.titleTag,
      });
    }

    if (contentIsEncrypted) {
      decryptedContent = decryptText({
        cipherText: entry.content,
        iv: entry.contentIv,
        tag: entry.contentTag,
      });
    }

    if (!titleIsEncrypted || !contentIsEncrypted) {
      await this.reencryptEntryIfNeeded(entry, decryptedTitle, decryptedContent);
    }

    return {
      ...entry,
      title: decryptedTitle,
      content: decryptedContent,
    } as JournalEntry;
  }

  private async reencryptEntryIfNeeded(entry: any, title: string, content: string): Promise<void> {
    const needsTitle = !isEncryptedPayload({ iv: entry.titleIv, tag: entry.titleTag });
    const needsContent = !isEncryptedPayload({ iv: entry.contentIv, tag: entry.contentTag });

    if (!needsTitle && !needsContent) {
      return;
    }

    const updates: Record<string, string> = {};

    if (needsTitle) {
      const encryptedTitle = encryptText(title);
      updates.title = encryptedTitle.cipherText;
      updates.titleIv = encryptedTitle.iv;
      updates.titleTag = encryptedTitle.tag;
    }

    if (needsContent) {
      const encryptedContent = encryptText(content);
      updates.content = encryptedContent.cipherText;
      updates.contentIv = encryptedContent.iv;
      updates.contentTag = encryptedContent.tag;
    }

    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: updates,
    });
  }

  /**
   * Create a new journal entry
   * @param userId - The user's ID
   * @param title - The entry title
   * @param content - The entry content
   * @param mood - Optional mood indicator
   * @param tags - Optional tags array
   * @returns The created journal entry
   */
  async create(
    userId: string,
    title: string,
    content: string,
    mood?: string,
    tags?: string[]
  ): Promise<JournalEntry> {
    try {
      const encryptedTitle = encryptText(title);
      const encryptedContent = encryptText(content);

      const entry = await prisma.journalEntry.create({
        data: {
          userId,
          title: encryptedTitle.cipherText,
          content: encryptedContent.cipherText,
          titleIv: encryptedTitle.iv,
          titleTag: encryptedTitle.tag,
          contentIv: encryptedContent.iv,
          contentTag: encryptedContent.tag,
          mood,
          tags: tags || [],
        },
      });
      return await this.decryptEntry(entry);
    } catch (error) {
      throw new Error(
        `Failed to create journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find a journal entry by ID with ownership verification
   * @param id - The entry's ID
   * @param userId - The user's ID (for ownership verification)
   * @returns The journal entry if found and owned by user, null otherwise
   */
  async findById(id: string, userId: string): Promise<JournalEntry | null> {
    try {
      const entry = await prisma.journalEntry.findUnique({
        where: { id },
      });

      // Verify ownership
      if (entry && entry.userId !== userId) {
        return null;
      }

      if (!entry) {
        return null;
      }

      return await this.decryptEntry(entry);
    } catch (error) {
      throw new Error(
        `Failed to find journal entry by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all journal entries for a user with pagination
   * @param userId - The user's ID
   * @param page - The page number (1-indexed)
   * @param limit - The number of entries per page
   * @param sortBy - The field to sort by (default: createdAt)
   * @param order - The sort order (ASC or DESC, default: DESC)
   * @returns Paginated list of journal entries
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<JournalEntry>> {
    try {
      // Validate pagination parameters
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100); // Cap at 100 per page
      const skip = (validPage - 1) * validLimit;

      // Fetch entries and total count
      const [entries, total] = await Promise.all([
        prisma.journalEntry.findMany({
          where: { userId },
          orderBy: {
            [sortBy]: order,
          },
          skip,
          take: validLimit,
        }),
        prisma.journalEntry.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(total / validLimit);

      const decryptedEntries = await Promise.all(entries.map((entry) => this.decryptEntry(entry)));

      return {
        data: decryptedEntries,
        total,
        page: validPage,
        limit: validLimit,
        totalPages,
      };
    } catch (error) {
      throw new Error(
        `Failed to find journal entries by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all journal entries for a user (for export)
   */
  async findAllByUserId(userId: string): Promise<JournalEntry[]> {
    try {
      const entries = await prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return await Promise.all(entries.map((entry) => this.decryptEntry(entry)));
    } catch (error) {
      throw new Error(
        `Failed to export journal entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update a journal entry
   * @param id - The entry's ID
   * @param userId - The user's ID (for ownership verification)
   * @param data - The data to update
   * @returns The updated journal entry
   */
  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      mood?: string;
      tags?: string[];
    }
  ): Promise<JournalEntry> {
    try {
      // Verify ownership before updating
      const entry = await prisma.journalEntry.findUnique({
        where: { id },
      });

      if (!entry || entry.userId !== userId) {
        throw new Error('Entry not found or access denied');
      }

      const updateData: Record<string, unknown> = {
        mood: data.mood,
        tags: data.tags,
      };

      if (data.title !== undefined) {
        const encryptedTitle = encryptText(data.title);
        updateData.title = encryptedTitle.cipherText;
        updateData.titleIv = encryptedTitle.iv;
        updateData.titleTag = encryptedTitle.tag;
      }

      if (data.content !== undefined) {
        const encryptedContent = encryptText(data.content);
        updateData.content = encryptedContent.cipherText;
        updateData.contentIv = encryptedContent.iv;
        updateData.contentTag = encryptedContent.tag;
      }

      const updatedEntry = await prisma.journalEntry.update({
        where: { id },
        data: updateData,
      });

      return await this.decryptEntry(updatedEntry);
    } catch (error) {
      throw new Error(
        `Failed to update journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a journal entry
   * @param id - The entry's ID
   * @param userId - The user's ID (for ownership verification)
   * @returns true if deleted, false if not found or access denied
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      // Verify ownership before deleting
      const entry = await prisma.journalEntry.findUnique({
        where: { id },
      });

      if (!entry || entry.userId !== userId) {
        return false;
      }

      await prisma.journalEntry.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default new EntryRepository();
