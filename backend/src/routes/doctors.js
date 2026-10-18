import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Sab routes admin-protected hain
router.use(requireAdmin);

// ============================================================
// GET ALL DOCTORS
// ============================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, specialization, room_no, phone, 
              username, is_active, created_at
       FROM consultants
       ORDER BY id DESC`
    );
    res.json({ ok: true, doctors: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET SINGLE DOCTOR
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, specialization, room_no, phone, 
              username, is_active
       FROM consultants WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ ok: true, doctor: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CREATE DOCTOR
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { name, specialization, room_no, phone, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ 
        error: 'Name, username, and password are required' 
      });
    }

    // Username check
    const [existing] = await pool.query(
      'SELECT id FROM consultants WHERE username = ?',
      [username]
    );
    if (existing.length) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO consultants 
       (name, specialization, room_no, phone, username, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, specialization || null, room_no || null, 
       phone || null, username, hash]
    );

    res.json({ 
      ok: true, 
      message: 'Doctor created successfully',
      id: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// UPDATE DOCTOR
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const { name, specialization, room_no, phone, username, password, is_active } = req.body;
    const id = req.params.id;

    // Check if doctor exists
    const [existing] = await pool.query(
      'SELECT id FROM consultants WHERE id = ?', [id]
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Username duplicate check (agar change kiya ho)
    if (username) {
      const [dup] = await pool.query(
        'SELECT id FROM consultants WHERE username = ? AND id != ?',
        [username, id]
      );
      if (dup.length) {
        return res.status(400).json({ error: 'Username already in use' });
      }
    }

    // Password hash agar diya gaya
    let hash = null;
    if (password && password.trim()) {
      hash = await bcrypt.hash(password, 10);
    }

    // Build dynamic update
    let sql = `UPDATE consultants SET 
                 name = ?, specialization = ?, room_no = ?, 
                 phone = ?, username = ?, is_active = ?`;
    const params = [name, specialization, room_no, phone, username, is_active ?? 1];

    if (hash) {
      sql += `, password_hash = ?`;
      params.push(hash);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await pool.query(sql, params);

    res.json({ ok: true, message: 'Doctor updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE DOCTOR (soft delete)
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE consultants SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    res.json({ ok: true, message: 'Doctor deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;