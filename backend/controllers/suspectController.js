// controllers/suspectController.js
const db = require('../config/db');

// ── GET /api/suspects ─────────────────────────────────────────
const getAllSuspects = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*,
              TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age
       FROM Suspect s
       ORDER BY s.name ASC`
    );
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch suspects.' });
  }
};

// ── GET /api/suspects/:id ─────────────────────────────────────
const getSuspectById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age
       FROM Suspect s WHERE s.suspect_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Suspect not found.' });
    }

    // Cases this suspect is linked to
    const [cases] = await db.execute(
      `SELECT cs.involvement_level, cs.is_arrested,
              cc.case_id, cc.status AS case_status, cc.priority,
              f.incident_location, f.incident_date
       FROM CaseSuspect cs
       JOIN CrimeCase cc ON cs.case_id = cc.case_id
       JOIN FIR       f  ON cc.fir_id  = f.fir_id
       WHERE cs.suspect_id = ?`,
      [req.params.id]
    );

    // Charges against this suspect
    const [charges] = await db.execute(
      `SELECT ch.charge_id, ch.date_charged, ch.status AS charge_status,
              ch.case_id,
              ls.ipc_section, ls.title AS section_title,
              ls.min_sentence, ls.max_sentence, ls.is_bailable
       FROM Charge ch
       JOIN LegalSection ls ON ch.section_id = ls.section_id
       WHERE ch.suspect_id = ?
       ORDER BY ch.date_charged DESC`,
      [req.params.id]
    );

    // Arrest history
    const [arrests] = await db.execute(
      `SELECT a.arrest_id, a.arrest_date, a.location, a.notes,
              o.name AS arresting_officer,
              cc.case_id
       FROM Arrest a
       JOIN Officer    o  ON a.officer_id = o.officer_id
       JOIN CrimeCase  cc ON a.case_id    = cc.case_id
       WHERE a.suspect_id = ?
       ORDER BY a.arrest_date DESC`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      data: { ...rows[0], cases, charges, arrests }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch suspect.' });
  }
};

// ── POST /api/suspects ────────────────────────────────────────
const createSuspect = async (req, res) => {
  const { name, dob, gender, address, contact, national_id, criminal_record, prior_offenses } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Suspect name is required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO Suspect
         (name, dob, gender, address, contact, national_id, criminal_record, prior_offenses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        dob           || null,
        gender        || null,
        address       || null,
        contact       || null,
        national_id   || null,
        criminal_record  !== undefined ? criminal_record  : false,
        prior_offenses   !== undefined ? prior_offenses   : 0
      ]
    );
    return res.status(201).json({
      success: true,
      message: 'Suspect created.',
      data: { suspect_id: result.insertId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create suspect.' });
  }
};

// ── POST /api/suspects/:id/link ───────────────────────────────
// Link a suspect to a case
const linkToCase = async (req, res) => {
  const { case_id, involvement_level } = req.body;
  const valid = ['primary', 'secondary', 'accomplice', 'person_of_interest'];
  if (!case_id || !valid.includes(involvement_level)) {
    return res.status(400).json({ success: false, message: 'case_id and valid involvement_level required.' });
  }
  try {
    await db.execute(
      'INSERT INTO CaseSuspect (case_id, suspect_id, involvement_level) VALUES (?, ?, ?)',
      [case_id, req.params.id, involvement_level]
    );
    return res.status(201).json({ success: true, message: 'Suspect linked to case.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Suspect already linked to this case.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to link suspect.' });
  }
};

// ── POST /api/suspects/arrest ─────────────────────────────────
// Calls stored procedure arrest_suspect() — REPEATABLE READ
// Trigger 3 fires inside SP: if all suspects arrested → case → pending_trial
// Trigger 4 fires inside SP: status change logged in InvestigationLog
const arrestSuspect = async (req, res) => {
  const { suspect_id, officer_id, case_id, location } = req.body;
  if (!suspect_id || !officer_id || !case_id) {
    return res.status(400).json({
      success: false,
      message: 'suspect_id, officer_id, case_id are required.'
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.execute(
      'CALL arrest_suspect(?, ?, ?, ?, @arrest_id, @msg)',
      [suspect_id, officer_id, case_id, location || null]
    );

    const [[result]] = await conn.execute(
      'SELECT @arrest_id AS arrest_id, @msg AS message'
    );

    const success = result.message && result.message.startsWith('SUCCESS');
    return res.status(success ? 201 : 400).json({
      success,
      message: result.message,
      data: success ? { arrest_id: result.arrest_id } : null
    });
  } catch (err) {
    console.error('arrestSuspect error:', err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || 'Arrest failed.'
    });
  } finally {
    conn.release();
  }
};

module.exports = { getAllSuspects, getSuspectById, createSuspect, linkToCase, arrestSuspect };
