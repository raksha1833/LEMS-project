// controllers/caseController.js
const db = require('../config/db');

// ── GET /api/cases ────────────────────────────────────────────
// Uses VIEW: vw_active_cases_per_station
const getAllCases = async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = 'SELECT * FROM vw_active_cases_per_station WHERE 1=1';
    const params = [];

    // Officers see only their station
    if (req.user.role === 'officer' && req.user.station_id) {
      query += ' AND station_id = ?';
      params.push(req.user.station_id);
    }
    if (status)   { query += ' AND case_status = ?'; params.push(status); }
    if (priority) { query += ' AND priority = ?';    params.push(priority); }

    const [rows] = await db.execute(query, params);
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('getAllCases error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch cases.' });
  }
};

// ── GET /api/cases/timeline ───────────────────────────────────
// Uses VIEW: vw_case_timeline
const getCaseTimeline = async (req, res) => {
  try {
    let query = 'SELECT * FROM vw_case_timeline WHERE 1=1';
    const params = [];

    if (req.user.role === 'officer' && req.user.station_id) {
      query += ' AND station_name = (SELECT name FROM Station WHERE station_id = ?)';
      params.push(req.user.station_id);
    }

    const [rows] = await db.execute(query, params);
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch timeline.' });
  }
};

// ── GET /api/cases/:id ────────────────────────────────────────
// Full case detail — all related records
const getCaseById = async (req, res) => {
  const caseId = req.params.id;
  try {
    // Base case info
    const [caseRows] = await db.execute(
      `SELECT c.*, f.complainant_name, f.complainant_contact,
              f.incident_date, f.incident_location, f.description AS fir_description,
              f.date_filed, f.status AS fir_status,
              s.name AS station_name, d.name AS district_name
       FROM CrimeCase c
       JOIN FIR     f ON c.fir_id      = f.fir_id
       JOIN Station s ON f.station_id  = s.station_id
       JOIN District d ON s.district_id = d.district_id
       WHERE c.case_id = ?`,
      [caseId]
    );
    if (caseRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Officers assigned to this case
    const [officers] = await db.execute(
      `SELECT co.role, co.assigned_at,
              o.officer_id, o.name, o.contact,
              r.title AS officer_rank
       FROM CaseOfficer co
       JOIN Officer     o ON co.officer_id = o.officer_id
       JOIN OfficerRank r ON o.rank_id     = r.rank_id
       WHERE co.case_id = ?`,
      [caseId]
    );

    // Suspects linked to this case
    const [suspects] = await db.execute(
      `SELECT cs.involvement_level, cs.is_arrested, cs.added_at,
              s.suspect_id, s.name, s.dob, s.gender,
              s.address, s.contact, s.national_id,
              s.criminal_record, s.prior_offenses
       FROM CaseSuspect cs
       JOIN Suspect s ON cs.suspect_id = s.suspect_id
       WHERE cs.case_id = ?`,
      [caseId]
    );

    // Victims
    const [victims] = await db.execute(
      'SELECT * FROM Victim WHERE case_id = ? ORDER BY created_at',
      [caseId]
    );

    // Witnesses
    const [witnesses] = await db.execute(
      'SELECT * FROM Witness WHERE case_id = ? ORDER BY created_at',
      [caseId]
    );

    // Evidence
    const [evidence] = await db.execute(
      `SELECT e.*,
              o.name AS collected_by_name
       FROM Evidence e
       JOIN Officer o ON e.collected_by = o.officer_id
       WHERE e.case_id = ?
       ORDER BY e.date_collected`,
      [caseId]
    );

    // Charges with IPC section details
    const [charges] = await db.execute(
      `SELECT ch.charge_id, ch.date_charged, ch.status AS charge_status, ch.notes,
              s.suspect_id, s.name AS suspect_name,
              ls.section_id, ls.ipc_section, ls.title AS section_title,
              ls.min_sentence, ls.max_sentence, ls.is_bailable
       FROM Charge ch
       JOIN Suspect     s  ON ch.suspect_id = s.suspect_id
       JOIN LegalSection ls ON ch.section_id = ls.section_id
       WHERE ch.case_id = ?
       ORDER BY ch.date_charged`,
      [caseId]
    );

    // Arrests
    const [arrests] = await db.execute(
      `SELECT a.arrest_id, a.arrest_date, a.location, a.notes,
              s.name AS suspect_name,
              o.name AS arresting_officer
       FROM Arrest a
       JOIN Suspect s ON a.suspect_id = s.suspect_id
       JOIN Officer o ON a.officer_id = o.officer_id
       WHERE a.case_id = ?
       ORDER BY a.arrest_date`,
      [caseId]
    );

    // Investigation log
    const [logs] = await db.execute(
      `SELECT il.log_id, il.action_taken, il.action_date, il.remarks,
              o.name AS officer_name
       FROM InvestigationLog il
       JOIN Officer o ON il.officer_id = o.officer_id
       WHERE il.case_id = ?
       ORDER BY il.action_date ASC`,
      [caseId]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...caseRows[0],
        officers,
        suspects,
        victims,
        witnesses,
        evidence,
        charges,
        arrests,
        investigation_log: logs
      }
    });
  } catch (err) {
    console.error('getCaseById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch case details.' });
  }
};

// ── PUT /api/cases/:id/priority ───────────────────────────────
const updatePriority = async (req, res) => {
  const { priority } = req.body;
  const valid = ['low', 'medium', 'high', 'critical'];
  if (!valid.includes(priority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority.' });
  }
  try {
    await db.execute(
      'UPDATE CrimeCase SET priority = ? WHERE case_id = ?',
      [priority, req.params.id]
    );
    return res.status(200).json({ success: true, message: `Priority updated to ${priority}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update priority.' });
  }
};

// ── POST /api/cases/:id/officers ──────────────────────────────
// Assign additional officer to a case
const assignOfficer = async (req, res) => {
  const { officer_id, role } = req.body;
  const validRoles = ['lead', 'supporting', 'investigator', 'forensics'];
  if (!officer_id || !validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'officer_id and valid role required.' });
  }
  try {
    await db.execute(
      'INSERT INTO CaseOfficer (case_id, officer_id, role) VALUES (?, ?, ?)',
      [req.params.id, officer_id, role]
    );
    return res.status(201).json({ success: true, message: 'Officer assigned to case.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Officer already assigned to this case.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to assign officer.' });
  }
};

// ── PUT /api/cases/:id/close ──────────────────────────────────
// Calls stored procedure close_case() — SERIALIZABLE + FOR UPDATE
const closeCase = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.execute('CALL close_case(?, @msg)', [req.params.id]);
    const [[result]] = await conn.execute('SELECT @msg AS message');

    const success = result.message && result.message.startsWith('SUCCESS');
    return res.status(success ? 200 : 400).json({
      success,
      message: result.message
    });
  } catch (err) {
    console.error('closeCase error:', err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || 'Failed to close case.'
    });
  } finally {
    conn.release();
  }
};

// ── POST /api/cases/:id/victims ───────────────────────────────
const addVictim = async (req, res) => {
  const { name, dob, gender, contact, address } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Victim name is required.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO Victim (name, dob, gender, contact, address, case_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, dob || null, gender || null, contact || null, address || null, req.params.id]
    );
    return res.status(201).json({ success: true, message: 'Victim added.', data: { victim_id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add victim.' });
  }
};

// ── POST /api/cases/:id/witnesses ─────────────────────────────
const addWitness = async (req, res) => {
  const { name, contact, address, statement, is_protected } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Witness name is required.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO Witness (name, contact, address, case_id, statement, is_protected) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contact || null, address || null, req.params.id, statement || null, is_protected || false]
    );
    return res.status(201).json({ success: true, message: 'Witness added.', data: { witness_id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add witness.' });
  }
};

// ── POST /api/cases/:id/log ───────────────────────────────────
// Manually add investigation log entry
const addLog = async (req, res) => {
  const { officer_id, action_taken, remarks } = req.body;
  if (!officer_id || !action_taken) {
    return res.status(400).json({ success: false, message: 'officer_id and action_taken required.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO InvestigationLog (case_id, officer_id, action_taken, remarks) VALUES (?, ?, ?, ?)',
      [req.params.id, officer_id, action_taken, remarks || null]
    );
    return res.status(201).json({ success: true, message: 'Log entry added.', data: { log_id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add log.' });
  }
};

module.exports = {
  getAllCases, getCaseTimeline, getCaseById,
  updatePriority, assignOfficer, closeCase,
  addVictim, addWitness, addLog
};
