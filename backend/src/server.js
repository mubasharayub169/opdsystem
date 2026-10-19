import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './db.js';
import authRoutes from './routes/auth.js';
import doctorsRoutes from './routes/doctors.js';
import receptionistsRoutes from './routes/receptionists.js';
import receptionistRoutes from './routes/receptionist.js';
import doctorRoutes from './routes/doctor.js';
import medicinesRoutes from './routes/medicines.js';

dotenv.config();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/admin/doctors', doctorsRoutes);
app.use('/api/admin/receptionists', receptionistsRoutes);
app.use('/api/admin/medicines', medicinesRoutes);
app.use('/api/staff', receptionistRoutes);
app.use('/api/doctor', doctorRoutes);

// ============================================================
// ADMIN STATS
// ============================================================
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { pool } = await import('./db.js');

    const [
      [docResult],
      [recResult],
      [patResult],
      [todayVisitsResult],
      [waitingResult]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM consultants WHERE is_active = 1'),
      pool.query('SELECT COUNT(*) AS count FROM receptionists WHERE is_active = 1'),
      pool.query('SELECT COUNT(*) AS count FROM patients'),
      pool.query(`SELECT COUNT(*) AS count FROM opd_visits
                  WHERE DATE(visit_date) = CURDATE()`),
      pool.query(`SELECT COUNT(*) AS count FROM opd_visits
                  WHERE DATE(visit_date) = CURDATE() AND status = 'Waiting'`)
    ]);

    res.json({
      ok: true,
      stats: {
        doctors: docResult[0].count,
        receptionists: recResult[0].count,
        patients: patResult[0].count,
        todayVisits: todayVisitsResult[0].count,
        waiting: waitingResult[0].count
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TEST DB ROUTE
// ============================================================
app.get('/api/test-db', async (req, res) => {
  try {
    const { pool } = await import('./db.js');
    const [rows] = await pool.query(
      'SELECT id, name, username FROM consultants LIMIT 5'
    );
    res.json({ ok: true, doctors: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// SERVE FRONTEND (React Build)
// ============================================================
// Ye line batati hai ke 'public' folder ki static files (HTML, CSS, JS) serve karo
app.use(express.static(path.join(__dirname, '../public')));

// SPA Fallback: Agar koi /api route na ho, to index.html bhejo (React Router handle karega)
app.get('*', (req, res) => {
  // Agar request API ke liye nahi hai, to frontend index.html bhejo
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// ============================================================
// SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-consultant', (id) => {
    socket.join(`consultant_${id}`);
    console.log(`Consultant ${id} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('════════════════════════════════════════════');
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log('════════════════════════════════════════════');
  console.log('');
});