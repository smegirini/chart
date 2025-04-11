import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db', // Default to service name in docker-compose
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'schedule_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add timezone for consistency if needed
  // timezone: '+00:00' 
});

// Test the connection using an async IIFE
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
    // Optionally exit process if DB connection is critical for startup
    // process.exit(1);
  }
})(); // Immediately invoke the async function

export default pool; 