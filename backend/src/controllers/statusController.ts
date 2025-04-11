import { Request, Response } from 'express';
import pool from '../config/db';

// Get all task statuses
export const getAllStatuses = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM task_statuses ORDER BY id'); // Order by ID likely makes sense here
    res.json(rows);
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    res.status(500).json({ message: 'Server error while fetching task statuses' });
  }
};

// Potential future functions: getStatusById, createStatus, updateStatus, deleteStatus 