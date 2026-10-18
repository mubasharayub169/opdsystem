import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// ADMIN LOGIN
// ============================================================
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, name: admin.name, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// RECEPTIONIST LOGIN
// ============================================================
router.post('/receptionist/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [rows] = await pool.query(
      `SELECT r.*, c.name AS consultant_name, c.room_no AS consultant_room,
              c.specialization AS consultant_specialization
       FROM receptionists r
       LEFT JOIN consultants c ON c.id = r.consultant_id
       WHERE r.username = ? AND r.is_active = 1`,
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const rec = rows[0];
    const ok = await bcrypt.compare(password, rec.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      {
        id: rec.id,
        name: rec.name,
        role: 'receptionist',
        consultant_id: rec.consultant_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: rec.id,
        name: rec.name,
        role: 'receptionist',
        consultant_id: rec.consultant_id,
        consultant_name: rec.consultant_name,
        consultant_room: rec.consultant_room,
        consultant_specialization: rec.consultant_specialization
      }
    });
  } catch (err) {
    console.error('Receptionist login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DOCTOR LOGIN
// ============================================================
router.post('/doctor/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM consultants WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const doctor = rows[0];
    const ok = await bcrypt.compare(password, doctor.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      {
        id: doctor.id,
        name: doctor.name,
        role: 'doctor',
        specialization: doctor.specialization,
        room_no: doctor.room_no
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: doctor.id,
        name: doctor.name,
        role: 'doctor',
        specialization: doctor.specialization,
        room_no: doctor.room_no,
        username: doctor.username
      }
    });
  } catch (err) {
    console.error('Doctor login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CHANGE PASSWORD — All roles
// ============================================================
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const { id, role } = req.user;

    let table = '';
    if (role === 'admin') table = 'admins';
    else if (role === 'receptionist') table = 'receptionists';
    else if (role === 'doctor') table = 'consultants';
    else return res.status(400).json({ error: 'Invalid role' });

    const [rows] = await pool.query(
      `SELECT password_hash FROM ${table} WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE ${table} SET password_hash = ? WHERE id = ?`,
      [newHash, id]
    );

    res.json({ ok: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;