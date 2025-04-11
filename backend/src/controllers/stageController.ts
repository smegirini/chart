import { Request, Response } from 'express';
import pool from '../config/db';

// Get all task stages
export const getAllStages = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM task_stages ORDER BY id'); // Order by ID likely makes sense here
    res.json(rows);
  } catch (error) {
    console.error('Error fetching task stages:', error);
    res.status(500).json({ message: 'Server error while fetching task stages' });
  }
};

// Potential future functions: getStageById, createStage, updateStage, deleteStage 