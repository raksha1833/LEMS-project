// controllers/evidenceController.js
const db = require('../config/db');

// ── GET /api/evidence ─────────────────────────────────────────
const getAllEvidence = async (req, res) => {
  try {
    const { case_id, status } = req.query;
    let query = `
      SELECT e.*,
             o.name AS collected_by_name,
             cc.status AS case_status
      FROM Evidence e
      JOIN Officer   o  ON e.collected_by = o.officer_id
      JOIN CrimeCase cc ON e.case_id      = cc.case_id
      WHERE 1=1
    `;
    const params = [];
    if (case_id) { query += ' AND e.case_id = ?'; params.push(case_id); }
    if (status)  { query += ' AND e.status = ?';  params.push(status); }
    query += ' ORDER BY e.date_collected DESC';

    const [rows] = await db.execute(query, params);
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch evidence.' });
  }
};

// ── GET /api/evidence/:id ─────────────────────────────────────
const getEvidenceById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.*, o.name AS collected_by_name, cc.status AS case_status
       FROM Evidence e
       JOIN Officer   o  ON e.collected_by = o.officer_id
       JOIN CrimeCase cc ON e.case_id      = cc.case_id
       WHERE e.evidence_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evidence not found.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch evidence.' });
  }
};

// ── POST /api/evidence ────────────────────────────────────────
const addEvidence = async (req, res) => {
  const { case_id, type, description, collected_by, date_collected, storage_location } = req.body;
  if (!case_id || !type || !description || !collected_by || !date_collected) {
    return res.status(400).json({
      success: false,
      message: 'case_id, type, description, collected_by, date_collected are required.'
    });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO Evidence
         (case_id, type, description, collected_by, date_collected, storage_location, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [case_id, type, description, collected_by, date_collected, storage_location || null]
    );
    return res.status(201).json({
      success: true,
      message: 'Evidence added.',
      data: { evidence_id: result.insertId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add evidence.' });
  }
};

// ── PUT /api/evidence/:id/status ──────────────────────────────
// Trigger 2 fires on DELETE — blocks if case is active
// Status update is safe (seal/analyze) — no trigger on UPDATE
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['active', 'under_analysis', 'sealed', 'destroyed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Use: active, under_analysis, sealed, destroyed' });
  }
  try {
    await db.execute(
      'UPDATE Evidence SET status = ? WHERE evidence_id = ?',
      [status, req.params.id]
    );
    return res.status(200).json({
      success: true,
      message: `Evidence status updated to ${status}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update evidence status.' });
  }
};

// ── DELETE /api/evidence/:id ──────────────────────────────────
// Trigger 2 blocks this if case is still open/investigating/pending_trial
const deleteEvidence = async (req, res) => {
  try {
    await db.execute('DELETE FROM Evidence WHERE evidence_id = ?', [req.params.id]);
    return res.status(200).json({ success: true, message: 'Evidence deleted.' });
  } catch (err) {
    // Trigger 2 fires SIGNAL SQLSTATE 45000 — caught here
    if (err.sqlState === '45000') {
      return res.status(400).json({
        success: false,
        message: err.sqlMessage || 'Cannot delete evidence for an active case.'
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete evidence.' });
  }
};

module.exports = { getAllEvidence, getEvidenceById, addEvidence, updateStatus, deleteEvidence };
