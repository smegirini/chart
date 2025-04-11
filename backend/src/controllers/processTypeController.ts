import { Request, Response } from 'express';
import pool from '../config/db';

// Get all process types
export const getAllProcessTypes = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM process_types ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching process types:', error);
    res.status(500).json({ message: 'Server error while fetching process types' });
  }
};

// Potential future functions: getProcessTypeById, createProcessType, updateProcessType, deleteProcessType 