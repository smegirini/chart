import express, { Request, Response, NextFunction } from 'express';
import { getAllStages } from '../controllers/stageController';

const router = express.Router();

// Helper for async routes
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /api/stages
router.get('/', asyncHandler(getAllStages));

// Define other routes later if needed

export default router; 