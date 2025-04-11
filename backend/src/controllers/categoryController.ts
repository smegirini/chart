import { Request, Response } from 'express';
import pool from '../config/db';

// Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
};

// Potential future functions: getCategoryById, createCategory, updateCategory, deleteCategory 