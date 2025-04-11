import express, { Request, Response, NextFunction } from 'express';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskById
} from '../controllers/taskController';

const router = express.Router();

// Helper for async routes
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.get('/', asyncHandler(getAllTasks));
router.post('/', asyncHandler(createTask));
router.get('/:id', asyncHandler(getTaskById));
router.put('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

export default router; 