import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ApiError, AuthenticationError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { generateInsightFromEntry } from '../utils/insights.js';
import UserRepository from '../repositories/UserRepository.js';

export class AiController {
  /**
   * Generate insight for a prompt
   * POST /api/v1/ai
   */
  async generateInsight(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        throw new ValidationError('Prompt is required', { prompt: 'Prompt is required' });
      }

      const user = await UserRepository.findById(req.user.userId);
      if (!user?.aiConsent) {
        throw new AuthorizationError('AI analysis requires explicit consent');
      }

      const insight = generateInsightFromEntry(prompt);

      res.status(200).json({
        success: true,
        data: {
          insight: insight.summary,
          themes: insight.themes,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('Not authenticated')) {
          throw new AuthenticationError(error.message);
        }
      }

      throw new ApiError(500, 'Failed to generate insight', 'INSIGHT_GENERATION_FAILED');
    }
  }
}

export default new AiController();
