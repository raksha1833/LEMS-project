// controllers/chargeController.js
const db = require('../config/db');

// ── GET /api/legal-sections ───────────────────────────────────
const getLegalSections = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM LegalSection ORDER BY ipc_section'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch legal sections.' });
  }
};

// ── GET /api/charges?case_id=X ────────────────────────────────
const getCharges = async (req, res) => {
  try {
    const { case_id, suspect_id } = req.query;
    let query = `
      SELECT ch.charge_id, ch.date_charged, ch.status AS charge_status, ch.notes,
             ch.case_id, ch.suspect_id, ch.section_id,
             s.name  AS suspect_name,
             ls.ipc_section, ls.title AS section_title,
             ls.min_sentence, ls.max_sentence, ls.is_bailable
      FROM Charge ch
      JOIN Suspect      s  ON ch.suspect_id = s.suspect_id
      JOIN LegalSection ls ON ch.section_id = ls.section_id
      WHERE 1=1
    `;
    const params = [];
    if (case_id)    { query += ' AND ch.case_id = ?';    params.push(case_id); }
    if (suspect_id) { query += ' AND ch.suspect_id = ?'; params.push(suspect_id); }
    query += ' ORDER BY ch.date_charged DESC';

    const [rows] = await db.execute(query, params);
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch charges.' });
  }
};

// ── POST /api/charges ─────────────────────────────────────────
const addCharge = async (req, res) => {
  const { case_id, suspect_id, section_id, notes } = req.body;
  if (!case_id || !suspect_id || !section_id) {
    return res.status(400).json({
      success: false,
      message: 'case_id, suspect_id, section_id are required.'
    });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO Charge (case_id, suspect_id, section_id, date_charged, status, notes)
       VALUES (?, ?, ?, NOW(), 'pending', ?)`,
      [case_id, suspect_id, section_id, notes || null]
    );
    return res.status(201).json({
      success: true,
      message: 'Charge filed successfully.',
      data: { charge_id: result.insertId }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This IPC section is already charged against this suspect in this case.'
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to file charge.' });
  }
};

// ── PUT /api/charges/:id/status ───────────────────────────────
const updateChargeStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'convicted', 'acquitted', 'dropped'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid charge status.' });
  }
  try {
    await db.execute(
      'UPDATE Charge SET status = ? WHERE charge_id = ?',
      [status, req.params.id]
    );
    return res.status(200).json({ success: true, message: `Charge status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update charge.' });
  }
};

module.exports = { getLegalSections, getCharges, addCharge, updateChargeStatus };
