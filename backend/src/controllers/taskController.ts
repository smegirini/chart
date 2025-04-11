import { Request, Response } from 'express';
import pool from '../config/db';

// 모든 작업 가져오기
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    // Join process_types table as well
    const [rows] = await pool.query(`
      SELECT 
        t.*, 
        c.name as category_name, 
        pt.name as process_type_name, 
        s.name as stage_name, 
        st.name as status_name, 
        st.color as status_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN process_types pt ON t.process_type_id = pt.id
      LEFT JOIN task_stages s ON t.stage_id = s.id
      LEFT JOIN task_statuses st ON t.status_id = st.id
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// 작업 생성
export const createTask = async (req: Request, res: Response) => {
  const { 
    name, 
    category_id, 
    process_type_id, 
    stage_id, 
    status_id, 
    start_date, 
    end_date, 
    progress 
  } = req.body;

  // Basic validation
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required fields: name, start_date, end_date' });
  }
  
  try {
    const [result] = await pool.query(
      `INSERT INTO tasks 
       (name, category_id, process_type_id, stage_id, status_id, start_date, end_date, progress) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [name, category_id, process_type_id, stage_id, status_id || 1, start_date, end_date, progress || 0]
    );
    
    const insertId = (result as any).insertId;
    // Fetch the created task with joined data to return
    const [newTaskRows] = await pool.query(
      `SELECT t.*, c.name as category_name, pt.name as process_type_name, s.name as stage_name, st.name as status_name, st.color as status_color
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN process_types pt ON t.process_type_id = pt.id
       LEFT JOIN task_stages s ON t.stage_id = s.id
       LEFT JOIN task_statuses st ON t.status_id = st.id
       WHERE t.id = ?`, [insertId]
    );

    if ((newTaskRows as any[]).length > 0) {
       res.status(201).json((newTaskRows as any[])[0]);
    } else {
      // Fallback if fetch fails, though unlikely
      res.status(201).json({ id: insertId, ...req.body, status_id: status_id || 1, progress: progress || 0 });
    }

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// 작업 업데이트
export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, 
    category_id, 
    process_type_id, 
    stage_id, 
    status_id, 
    start_date, 
    end_date, 
    progress 
  } = req.body;

  // Basic validation
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required fields: name, start_date, end_date' });
  }
  
  try {
    const [result] = await pool.query(
      `UPDATE tasks 
       SET name = ?, category_id = ?, process_type_id = ?, stage_id = ?, 
           status_id = ?, start_date = ?, end_date = ?, progress = ? 
       WHERE id = ?`, 
      [name, category_id, process_type_id, stage_id, status_id, start_date, end_date, progress, id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found or no changes made' });
    }

    // Fetch the updated task with joined data to return
    const [updatedTaskRows] = await pool.query(
      `SELECT t.*, c.name as category_name, pt.name as process_type_name, s.name as stage_name, st.name as status_name, st.color as status_color
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN process_types pt ON t.process_type_id = pt.id
       LEFT JOIN task_stages s ON t.stage_id = s.id
       LEFT JOIN task_statuses st ON t.status_id = st.id
       WHERE t.id = ?`, [id]
    );

    if ((updatedTaskRows as any[]).length > 0) {
      res.json((updatedTaskRows as any[])[0]);
    } else {
      // Fallback if fetch fails
       res.status(404).json({ message: 'Updated task not found after update' });
    }

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// 작업 삭제
export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json({ message: 'Task deleted successfully' }); // Use 200 OK or 204 No Content
  } catch (error) {
    console.error('Error deleting task:', error);
    // Handle potential foreign key constraints if dependencies exist
    if ((error as any).code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'Cannot delete task because it has dependencies.' });
    }
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

// 단일 작업 가져오기
export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query(
      `SELECT 
         t.*, 
         c.name as category_name, 
         pt.name as process_type_name, 
         s.name as stage_name, 
         st.name as status_name,
         st.color as status_color
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN process_types pt ON t.process_type_id = pt.id
       LEFT JOIN task_stages s ON t.stage_id = s.id
       LEFT JOIN task_statuses st ON t.status_id = st.id
       WHERE t.id = ?`,
      [id]
    );
    
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
}; 