import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireMedicalOrAdmin } from '../middleware/roleMiddleware.js';
import MedicalController from '../controllers/MedicalController.js';

const router = Router();

/**
 * @swagger
 * /api/medical/analytics:
 *   get:
 *     summary: Get mood analytics (Medical Professional/Admin only)
 *     description: Retrieve aggregated, anonymized mood analytics
 *     tags:
 *       - Medical
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Medical Professional or Admin role required
 */
router.get(
    '/analytics',
    authMiddleware,
    requireMedicalOrAdmin,
    MedicalController.getAnalytics.bind(MedicalController)
);

/**
 * @swagger
 * /api/medical/overview:
 *   get:
 *     summary: Get patient overview (Medical Professional/Admin only)
 *     description: Retrieve patient activity overview
 *     tags:
 *       - Medical
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Medical Professional or Admin role required
 */
router.get(
    '/overview',
    authMiddleware,
    requireMedicalOrAdmin,
    MedicalController.getOverview.bind(MedicalController)
);

export default router;
