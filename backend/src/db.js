import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

// Test connection on startup
pool.query('SELECT 1')
  .then(() => console.log('✅ MySQL connected successfully'))
  .catch((err) => console.error('❌ MySQL connection failed:', err.message));