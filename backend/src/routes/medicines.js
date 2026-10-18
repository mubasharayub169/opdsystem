import express from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAdmin);

// ============================================================
// GET ALL
// ============================================================
router.get('/', async (req, res) => {
  try {
    const search = req.query.q || '';
    const q = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT id, name, generic_name, category, is_active, created_at
       FROM medicines_master
       WHERE name LIKE ? OR generic_name LIKE ? OR category LIKE ?
       ORDER BY name ASC
       LIMIT 500`,
      [q, q, q]
    );

    res.json({ ok: true, medicines: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CREATE
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { name, generic_name, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Medicine name required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM medicines_master WHERE name = ?',
      [name.trim()]
    );
    if (existing.length) {
      return res.status(400).json({ error: 'Medicine already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO medicines_master (name, generic_name, category)
       VALUES (?, ?, ?)`,
      [
        name.trim(),
        generic_name?.trim() || null,
        category?.trim() || null
      ]
    );

    res.json({ ok: true, id: result.insertId, message: 'Medicine added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// UPDATE
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const { name, generic_name, category, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Medicine name required' });
    }

    const [dup] = await pool.query(
      'SELECT id FROM medicines_master WHERE name = ? AND id != ?',
      [name.trim(), req.params.id]
    );
    if (dup.length) {
      return res.status(400).json({ error: 'Another medicine with same name exists' });
    }

    await pool.query(
      `UPDATE medicines_master SET
         name = ?, generic_name = ?, category = ?, is_active = ?
       WHERE id = ?`,
      [
        name.trim(),
        generic_name?.trim() || null,
        category?.trim() || null,
        is_active ?? 1,
        req.params.id
      ]
    );

    res.json({ ok: true, message: 'Medicine updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE medicines_master SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    res.json({ ok: true, message: 'Medicine deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// BULK IMPORT
// ============================================================
router.post('/bulk', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { medicines } = req.body;

    if (!Array.isArray(medicines) || medicines.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'No medicines provided' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const m of medicines) {
      if (!m.name || !m.name.trim()) {
        skipped++;
        continue;
      }

      const [exists] = await conn.query(
        'SELECT id FROM medicines_master WHERE name = ?',
        [m.name.trim()]
      );
      
      if (exists.length) {
        skipped++;
        continue;
      }

      await conn.query(
        `INSERT INTO medicines_master (name, generic_name, category)
         VALUES (?, ?, ?)`,
        [
          m.name.trim(),
          m.generic_name?.trim() || null,
          m.category?.trim() || null
        ]
      );
      inserted++;
    }

    await conn.commit();

    res.json({
      ok: true,
      inserted,
      skipped,
      message: `${inserted} medicines added, ${skipped} skipped`
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

export default router;