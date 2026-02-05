import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ApiError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MedicalController
 * Handles HTTP requests for medical professional endpoints
 */

export class MedicalController {
    /**
     * Get aggregated mood analytics
     * GET /api/medical/analytics
     */
    async getAnalytics(_req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Get mood distribution
            const moodCounts = await prisma.journalEntry.groupBy({
                by: ['mood'],
                _count: true,
                where: {
                    mood: { not: null },
                },
            });

            // Get entries over time (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const entriesOverTime = await prisma.journalEntry.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            res.status(200).json({
                success: true,
                data: {
                    moodDistribution: moodCounts.reduce((acc: any, item: any) => {
                        acc[item.mood] = item._count;
                        return acc;
                    }, {}),
                    entriesOverTime: entriesOverTime.map((item: any) => ({
                        date: item.createdAt,
                        count: item._count,
                    })),
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch analytics', 'ANALYTICS_FETCH_FAILED');
        }
    }

    /**
     * Get patient overview
     * GET /api/medical/overview
     */
    async getOverview(_req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const [totalPatients, totalEntries, activePatients] = await Promise.all([
                prisma.user.count(),
                prisma.journalEntry.count(),
                prisma.user.count({
                    where: {
                        entries: {
                            some: {
                                createdAt: {
                                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                                },
                            },
                        },
                    },
                }),
            ]);

            res.status(200).json({
                success: true,
                data: {
                    totalPatients,
                    totalEntries,
                    activePatients,
                    averageEntriesPerPatient: totalPatients > 0 ? (totalEntries / totalPatients).toFixed(2) : 0,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch overview', 'OVERVIEW_FETCH_FAILED');
        }
    }
}

export default new MedicalController();
