import express from 'express';
import { pool } from '../db.js';
import { requireDoctor } from '../middleware/auth.js';

const router = express.Router();

router.use(requireDoctor);

// ============================================================
// MY QUEUE
// ============================================================
router.get('/queue', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.token_no, v.mr_no, v.status, v.visit_date,
              v.started_at,
              p.name AS patient_name, p.age, p.gender, p.phone
       FROM opd_visits v
       LEFT JOIN patients p ON p.mr_no = v.mr_no
       WHERE v.consultant_id = ?
         AND DATE(v.visit_date) = CURDATE()
         AND v.status IN ('Waiting', 'InConsultation')
       ORDER BY v.token_no ASC`,
      [req.user.id]
    );
    res.json({ ok: true, queue: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// COMPLETED TODAY
// ============================================================
router.get('/completed', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.token_no, v.mr_no, v.status, v.visit_date,
              v.started_at, v.completed_at,
              p.name AS patient_name, p.age, p.gender, p.phone,
              pr.id AS rx_id, pr.diagnosis
       FROM opd_visits v
       LEFT JOIN patients p ON p.mr_no = v.mr_no
       LEFT JOIN prescriptions pr ON pr.visit_id = v.id
       WHERE v.consultant_id = ?
         AND DATE(v.visit_date) = CURDATE()
         AND v.status = 'Completed'
       ORDER BY v.completed_at DESC`,
      [req.user.id]
    );
    res.json({ ok: true, completed: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DAILY REPORT (Date-wise)
// ============================================================
router.get('/reports/daily', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const [visits] = await pool.query(
      `SELECT v.id, v.token_no, v.mr_no, v.status, 
              v.visit_date, v.completed_at,
              p.name AS patient_name, p.age, p.gender, p.phone,
              pr.diagnosis
       FROM opd_visits v
       LEFT JOIN patients p ON p.mr_no = v.mr_no
       LEFT JOIN prescriptions pr ON pr.visit_id = v.id
       WHERE v.consultant_id = ? AND DATE(v.visit_date) = ?
       ORDER BY v.token_no ASC`,
      [req.user.id, date]
    );

    const total = visits.length;
    const completed = visits.filter(v => v.status === 'Completed').length;
    const waiting = visits.filter(v => v.status === 'Waiting').length;
    const inConsultation = visits.filter(v => v.status === 'InConsultation').length;

    res.json({
      ok: true,
      date,
      summary: { total, completed, waiting, inConsultation },
      visits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SEARCH PATIENTS
// ============================================================
router.get('/patients/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      `SELECT DISTINCT p.id, p.mr_no, p.name, p.father_name,
              p.gender, p.age, p.phone, p.address,
              (SELECT COUNT(*) FROM opd_visits v2
               WHERE v2.mr_no = p.mr_no AND v2.consultant_id = ?) AS my_visits,
              (SELECT MAX(v3.visit_date) FROM opd_visits v3
               WHERE v3.mr_no = p.mr_no AND v3.consultant_id = ?) AS last_visit
       FROM patients p
       WHERE p.mr_no LIKE ? OR p.name LIKE ? OR p.phone LIKE ?
       ORDER BY p.id DESC
       LIMIT 25`,
      [req.user.id, req.user.id, q, q, q]
    );
    res.json({ ok: true, patients: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MEDICINES — Search
// ============================================================
router.get('/medicines/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      `SELECT id, name, generic_name, category
       FROM medicines_master
       WHERE is_active = 1
         AND (name LIKE ? OR generic_name LIKE ?)
       ORDER BY name ASC
       LIMIT 10`,
      [q, q]
    );
    res.json({ ok: true, medicines: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// VISIT DETAILS
// ============================================================
router.get('/visits/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.token_no, v.status, v.visit_date, v.mr_no,
              p.name AS patient_name, p.age, p.gender, p.phone,
              p.father_name, p.address
       FROM opd_visits v
       LEFT JOIN patients p ON p.mr_no = v.mr_no
       WHERE v.id = ? AND v.consultant_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json({ ok: true, visit: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET PRESCRIPTION BY VISIT ID
// ============================================================
router.get('/visits/:id/prescription', async (req, res) => {
  try {
    const [visitRows] = await pool.query(
      `SELECT v.id, v.token_no, v.visit_date, v.mr_no,
              p.name AS patient_name, p.age, p.gender, p.phone,
              p.father_name, p.address
       FROM opd_visits v
       LEFT JOIN patients p ON p.mr_no = v.mr_no
       WHERE v.id = ? AND v.consultant_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!visitRows.length) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const [rxRows] = await pool.query(
      `SELECT id, complaints, diagnosis, bp, pulse,
              temperature, weight, spo2, advice, follow_up_date
       FROM prescriptions
       WHERE visit_id = ?`,
      [req.params.id]
    );

    let prescription = null;

    if (rxRows.length) {
      const rx = rxRows[0];
      const [meds] = await pool.query(
        `SELECT medicine_name, dosage, duration, instructions
         FROM prescription_medicines
         WHERE prescription_id = ?
         ORDER BY id ASC`,
        [rx.id]
      );
      prescription = { ...rx, medicines: meds };
    }

    res.json({
      ok: true,
      visit: visitRows[0],
      prescription
    });
  } catch (err) {
    console.error('Get prescription error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START CONSULTATION
// ============================================================
router.post('/visits/:id/start', async (req, res) => {
  try {
    await pool.query(
      `UPDATE opd_visits
       SET status = 'InConsultation', started_at = NOW()
       WHERE id = ? AND consultant_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PATIENT HISTORY
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
              c.name AS consultant_name,
              pr.id AS rx_id, pr.diagnosis, pr.complaints,
              pr.bp, pr.pulse, pr.temperature, pr.weight, pr.spo2,
              pr.advice, pr.follow_up_date, pr.created_at AS rx_date
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
// SAVE PRESCRIPTION
// ============================================================
router.post('/prescriptions', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      visitId, mrNo, complaints, diagnosis, bp, pulse,
      temperature, weight, spo2, advice, followUpDate, medicines
    } = req.body;

    if (!visitId || !mrNo) {
      await conn.rollback();
      return res.status(400).json({ error: 'visitId and mrNo required' });
    }

    const [existing] = await conn.query(
      'SELECT id FROM prescriptions WHERE visit_id = ?',
      [visitId]
    );

    let rxId;

    if (existing.length) {
      rxId = existing[0].id;
      await conn.query(
        `UPDATE prescriptions SET
          complaints = ?, diagnosis = ?, bp = ?, pulse = ?,
          temperature = ?, weight = ?, spo2 = ?, advice = ?, follow_up_date = ?
         WHERE id = ?`,
        [
          complaints || null, diagnosis || null,
          bp || null, pulse || null, temperature || null,
          weight || null, spo2 || null, advice || null,
          followUpDate || null, rxId
        ]
      );
      await conn.query(
        'DELETE FROM prescription_medicines WHERE prescription_id = ?',
        [rxId]
      );
    } else {
      const [rxResult] = await conn.query(
        `INSERT INTO prescriptions
         (visit_id, mr_no, consultant_id, complaints, diagnosis,
          bp, pulse, temperature, weight, spo2, advice, follow_up_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          visitId, mrNo, req.user.id,
          complaints || null, diagnosis || null,
          bp || null, pulse || null, temperature || null,
          weight || null, spo2 || null, advice || null,
          followUpDate || null
        ]
      );
      rxId = rxResult.insertId;
    }

    for (const m of medicines || []) {
      if (!m.medicine_name?.trim()) continue;
      await conn.query(
        `INSERT INTO prescription_medicines
         (prescription_id, medicine_name, dosage, duration, instructions)
         VALUES (?,?,?,?,?)`,
        [
          rxId, m.medicine_name,
          m.dosage || null, m.duration || null,
          m.instructions || null
        ]
      );
    }

    await conn.query(
      `UPDATE opd_visits SET status = 'Completed', completed_at = NOW()
       WHERE id = ?`,
      [visitId]
    );

    await conn.commit();
    res.json({ ok: true, prescriptionId: rxId });
  } catch (err) {
    await conn.rollback();
    console.error('Save prescription error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ============================================================
// TEMPLATES — List, Create, Update, Delete
// ============================================================
router.get('/templates', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, template_name, diagnosis, advice, medicines_json, created_at
       FROM rx_templates
       WHERE consultant_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    const templates = rows.map(r => ({
      ...r,
      medicines: typeof r.medicines_json === 'string'
        ? JSON.parse(r.medicines_json)
        : r.medicines_json || []
    }));

    res.json({ ok: true, templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { template_name, diagnosis, advice, medicines } = req.body;

    if (!template_name) {
      return res.status(400).json({ error: 'Template name required' });
    }

    const [result] = await pool.query(
      `INSERT INTO rx_templates
       (consultant_id, template_name, diagnosis, advice, medicines_json)
       VALUES (?,?,?,?,?)`,
      [
        req.user.id,
        template_name,
        diagnosis || null,
        advice || null,
        JSON.stringify(medicines || [])
      ]
    );

    res.json({ ok: true, id: result.insertId, message: 'Template saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const { template_name, diagnosis, advice, medicines } = req.body;

    await pool.query(
      `UPDATE rx_templates
       SET template_name = ?, diagnosis = ?, advice = ?, medicines_json = ?
       WHERE id = ? AND consultant_id = ?`,
      [
        template_name,
        diagnosis || null,
        advice || null,
        JSON.stringify(medicines || []),
        req.params.id,
        req.user.id
      ]
    );

    res.json({ ok: true, message: 'Template updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM rx_templates WHERE id = ? AND consultant_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;