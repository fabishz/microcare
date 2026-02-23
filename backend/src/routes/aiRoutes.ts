import { Router, Request, Response, NextFunction } from 'express';
import AiController from '../controllers/AiController.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

function asyncHandler(fn: (req: AuthenticatedRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
}

router.post(
  '/',
  authMiddleware,
  asyncHandler(AiController.generateInsight.bind(AiController))
);

export default router;
