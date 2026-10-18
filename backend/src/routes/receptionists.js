import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ⚠️ IMPORTANT: Admin authentication
router.use(requireAdmin);

// ============================================================
// GET ALL RECEPTIONISTS
// ============================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.name, r.username, r.is_active, r.created_at,
              r.consultant_id,
              c.name AS consultant_name,
              c.room_no AS consultant_room,
              c.specialization AS consultant_specialization
       FROM receptionists r
       LEFT JOIN consultants c ON c.id = r.consultant_id
       ORDER BY r.id DESC`
    );
    res.json({ ok: true, receptionists: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CREATE
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { name, username, password, consultant_id } = req.body;

    if (!name || !username || !password || !consultant_id) {
      return res.status(400).json({
        error: 'Name, username, password, and consultant are required'
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM receptionists WHERE username = ?', [username]
    );
    if (existing.length) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO receptionists 
       (name, username, password_hash, consultant_id)
       VALUES (?, ?, ?, ?)`,
      [name, username, hash, consultant_id]
    );

    res.json({ ok: true, message: 'Receptionist created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// UPDATE
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const { name, username, password, consultant_id, is_active } = req.body;
    const id = req.params.id;

    const [existing] = await pool.query(
      'SELECT id FROM receptionists WHERE id = ?', [id]
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'Receptionist not found' });
    }

    if (username) {
      const [dup] = await pool.query(
        'SELECT id FROM receptionists WHERE username = ? AND id != ?',
        [username, id]
      );
      if (dup.length) {
        return res.status(400).json({ error: 'Username already in use' });
      }
    }

    let hash = null;
    if (password && password.trim()) {
      hash = await bcrypt.hash(password, 10);
    }

    let sql = `UPDATE receptionists SET 
                 name = ?, username = ?, consultant_id = ?, is_active = ?`;
    const params = [name, username, consultant_id, is_active ?? 1];

    if (hash) {
      sql += `, password_hash = ?`;
      params.push(hash);
    }
    sql += ` WHERE id = ?`;
    params.push(id);

    await pool.query(sql, params);
    res.json({ ok: true, message: 'Receptionist updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE (soft)
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE receptionists SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    res.json({ ok: true, message: 'Receptionist deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;