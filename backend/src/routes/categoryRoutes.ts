import express, { Request, Response, NextFunction } from 'express';
import { getAllCategories } from '../controllers/categoryController';

const router = express.Router();

// Helper for async routes (could be moved to a shared utility file)
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /api/categories
router.get('/', asyncHandler(getAllCategories));

// Define other routes (POST, PUT, DELETE, GET /:id) later if needed

export default router; 