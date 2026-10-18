import express from 'express';
import { pool } from '../db.js';
import { requireReceptionist } from '../middleware/auth.js';

const router = express.Router();

// Sab routes receptionist-protected
router.use(requireReceptionist);

// ============================================================
// SEARCH PATIENTS
// ============================================================
router.get('/patients/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      `SELECT id, mr_no, name, father_name, gender, age, phone, address
       FROM patients
       WHERE mr_no LIKE ? OR name LIKE ? OR phone LIKE ?
       ORDER BY id DESC
       LIMIT 20`,
      [q, q, q]
    );
    res.json({ ok: true, patients: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET PATIENT WITH HISTORY
// ============================================================
router.get('/patients/:mrNo/history', async (req, res) => {
  try {
    const [patients] = await pool.query(
      'SELECT * FROM patients WHERE mr_no = ?',
      [req.params.mrNo]
    );
    if (!patients.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [visits] = await pool.query(
      `SELECT v.id, v.token_no, v.visit_date, v.status,
              c.name AS consultant_name, c.specialization,
              pr.id AS rx_id, pr.diagnosis, pr.complaints, pr.advice,
              pr.follow_up_date, pr.created_at AS rx_date
       FROM opd_visits v
       LEFT JOIN consultants c ON c.id = v.consultant_id
       LEFT JOIN prescriptions pr ON pr.visit_id = v.id
       WHERE v.mr_no = ?
       ORDER BY v.visit_date DESC
       LIMIT 30`,
      [req.params.mrNo]
    );

    for (const v of visits) {
      if (v.rx_id) {
        const [meds] = await pool.query(
          'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
          [v.rx_id]
        );
        v.medicines = meds;
      }
    }

    res.json({ ok: true, patient: patients[0], visits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// REGISTER NEW PATIENT (auto MR number)
// ============================================================
router.post('/patients', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { name, father_name, gender, age, phone, address } = req.body;

    if (!name) {
      await conn.rollback();
      return res.status(400).json({ error: 'Patient name is required' });
    }

    // Get next MR number
    await conn.query(
      'UPDATE mr_sequence SET last_number = last_number + 1 WHERE id = 1'
    );
    const [[seq]] = await conn.query(
      'SELECT last_number FROM mr_sequence WHERE id = 1'
    );
    const mrNo = String(seq.last_number).padStart(6, '0');

    const [result] = await conn.query(
      `INSERT INTO patients 
       (mr_no, name, father_name, gender, age, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mrNo,
        name,
        father_name || null,
        gender || null,
        age || null,
        phone || null,
        address || null
      ]
    );

    await conn.commit();

    res.json({
      ok: true,
      message: 'Patient registered',
      patient: {
        id: result.insertId,
        mr_no: mrNo,
        name,
        father_name,
        gender,
        age,
        phone,
        address
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('Register patient error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ============================================================
// SEND PATIENT TO DOCTOR (create visit)
// ============================================================
router.post('/visits', async (req, res) => {
  try {
    const { mr_no } = req.body;
    const consultant_id = req.user.consultant_id;

    if (!mr_no) {
      return res.status(400).json({ error: 'MR number required' });
    }

    if (!consultant_id) {
      return res.status(400).json({ 
        error: 'No doctor assigned to this receptionist' 
      });
    }

    // Check patient exists
    const [pat] = await pool.query(
      'SELECT id, mr_no, name FROM patients WHERE mr_no = ?',
      [mr_no]
    );
    if (!pat.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Next token for today
    const [[tokenRow]] = await pool.query(
      `SELECT COALESCE(MAX(token_no), 0) + 1 AS next_token
       FROM opd_visits
       WHERE consultant_id = ? AND DATE(visit_date) = CURDATE()`,
      [consultant_id]
    );
    const tokenNo = tokenRow.next_token;

    const [result] = await pool.query(
      `INSERT INTO opd_visits 
       (token_no, mr_no, consultant_id, status, created_by)
       VALUES (?, ?, ?, 'Waiting', ?)`,
      [tokenNo, mr_no, consultant_id, req.user.id]
    );

    const visitId = result.insertId;

    // Real-time notification to doctor
    const payload = {
      visitId,
      tokenNo,
      mrNo: mr_no,
      patientName: pat[0].name,
      consultantId: consultant_id
    };
    req.io.to(`consultant_${consultant_id}`).emit('new-patient', payload);

    res.json({
      ok: true,
      message: 'Patient sent to doctor',
      visit: { id: visitId, token_no: tokenNo }
    });
  } catch (err) {
    console.error('Send to doctor error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TODAY'S QUEUE
// ============================================================
router.get('/queue', async (req, res) => {
  try {
    const consultant_id = req.user.consultant_id;

    if (!consultant_id) {
      return res.json({ ok: true, queue: [] });
    }

    const [rows] = await pool.query(
      `SELECT v.id, v.token_no, v.mr_no, v.status, v.visit_date,
              v.started_at, v.completed_at,
              p.name AS patient_name, p.age, p.gender, p.phone
       FROM opd_visits v
       LEFT JOIN patients p ON p.mr_no = v.mr_no
       WHERE v.consultant_id = ?
         AND DATE(v.visit_date) = CURDATE()
       ORDER BY v.token_no DESC
       LIMIT 50`,
      [consultant_id]
    );

    res.json({ ok: true, queue: rows });
  } catch (err) {
    console.error('Queue error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;