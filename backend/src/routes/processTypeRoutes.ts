import express, { Request, Response, NextFunction } from 'express';
import { getAllProcessTypes } from '../controllers/processTypeController';

const router = express.Router();

// Helper for async routes
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /api/process-types
router.get('/', asyncHandler(getAllProcessTypes));

// Define other routes later if needed

export default router; 