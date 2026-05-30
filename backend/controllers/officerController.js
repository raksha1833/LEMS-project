// controllers/officerController.js
const db = require('../config/db');

// ── GET /api/officers ─────────────────────────────────────────
const getAllOfficers = async (req, res) => {
  try {
    const { station_id, status } = req.query;
    let query = `
      SELECT o.officer_id, o.name, o.dob, o.gender,
             o.date_joined, o.status, o.contact,
             r.rank_id, r.title AS officer_rank, r.level, r.max_cases_allowed,
             s.station_id, s.name AS station,
             d.name AS district
      FROM Officer o
      JOIN OfficerRank r ON o.rank_id    = r.rank_id
      JOIN Station     s ON o.station_id = s.station_id
      JOIN District    d ON s.district_id = d.district_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'officer' && req.user.station_id) {
      query += ' AND o.station_id = ?';
      params.push(req.user.station_id);
    } else if (station_id) {
      query += ' AND o.station_id = ?';
      params.push(station_id);
    }

    if (status) { query += ' AND o.status = ?'; params.push(status); }

    query += ' ORDER BY r.level DESC, o.name ASC';
    const [rows] = await db.execute(query, params);
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
  console.error('getAllOfficers error:', err);
  return res.status(500).json({ success: false, message: 'Failed to fetch officers.' });
}
};

// ── GET /api/officers/workload ────────────────────────────────
// Uses VIEW: vw_officer_workload
const getWorkload = async (req, res) => {
  try {
    const { station_id } = req.query;
    let query = 'SELECT * FROM vw_officer_workload WHERE 1=1';
    const params = [];

    if (req.user.role === 'officer' && req.user.station_id) {
      query += ' AND station_name = (SELECT name FROM Station WHERE station_id = ?)';
      params.push(req.user.station_id);
    } else if (station_id) {
      query += ' AND station_name = (SELECT name FROM Station WHERE station_id = ?)';
      params.push(station_id);
    }

    query += ' ORDER BY active_assigned_cases DESC';
    const [rows] = await db.execute(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch workload.' });
  }
};

// ── GET /api/officers/ranks ───────────────────────────────────
const getRanks = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM OfficerRank ORDER BY level ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch ranks.' });
  }
};

// ── GET /api/officers/:id ─────────────────────────────────────
const getOfficerById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT o.*, r.title AS officer_rank, r.level, r.max_cases_allowed,
              s.name AS station, d.name AS district
       FROM Officer o
       JOIN OfficerRank r ON o.rank_id    = r.rank_id
       JOIN Station     s ON o.station_id = s.station_id
       JOIN District    d ON s.district_id = d.district_id
       WHERE o.officer_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Officer not found.' });
    }

    // Their recent investigation log entries
    const [logs] = await db.execute(
      `SELECT il.log_id, il.action_taken, il.action_date,
              il.remarks, cc.case_id
       FROM InvestigationLog il
       JOIN CrimeCase cc ON il.case_id = cc.case_id
       WHERE il.officer_id = ?
       ORDER BY il.action_date DESC LIMIT 10`,
      [req.params.id]
    );

    return res.status(200).json({ success: true, data: { ...rows[0], recent_logs: logs } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch officer.' });
  }
};

// ── POST /api/officers ────────────────────────────────────────
const createOfficer = async (req, res) => {
  const { name, dob, gender, rank_id, station_id, date_joined, contact } = req.body;
  if (!name || !dob || !gender || !rank_id || !station_id || !date_joined) {
    return res.status(400).json({ success: false, message: 'name, dob, gender, rank_id, station_id, date_joined are required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO Officer (name, dob, gender, rank_id, station_id, date_joined, status, contact)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [name, dob, gender, rank_id, station_id, date_joined, contact || null]
    );
    return res.status(201).json({
      success: true,
      message: 'Officer created.',
      data: { officer_id: result.insertId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create officer.' });
  }
};

// ── PUT /api/officers/:id/status ──────────────────────────────
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['active', 'suspended', 'retired'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    await db.execute('UPDATE Officer SET status = ? WHERE officer_id = ?', [status, req.params.id]);
    return res.status(200).json({ success: true, message: `Officer status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

module.exports = { getAllOfficers, getWorkload, getRanks, getOfficerById, createOfficer, updateStatus };
