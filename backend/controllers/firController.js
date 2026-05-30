// controllers/firController.js
const db = require('../config/db');

// ── GET /api/fir ──────────────────────────────────────────────
// Officers see only their station. Admin sees all.
const getAllFIRs = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT f.fir_id, f.date_filed, f.complainant_name,
             f.complainant_contact, f.incident_date,
             f.incident_location, f.description, f.status,
             s.name AS station_name,
             d.name AS district_name,
             o.name AS registered_by,
             c.case_id, c.status AS case_status
      FROM FIR f
      JOIN Station  s ON f.station_id = s.station_id
      JOIN District d ON s.district_id = d.district_id
      JOIN Officer  o ON f.officer_id  = o.officer_id
      LEFT JOIN CrimeCase c ON c.fir_id = f.fir_id
      WHERE 1=1
    `;
    const params = [];

    // Officers only see their own station's FIRs
    if (req.user.role === 'officer' && req.user.station_id) {
      query += ' AND f.station_id = ?';
      params.push(req.user.station_id);
    }

    if (status) {
      query += ' AND f.status = ?';
      params.push(status);
    }

    query += ' ORDER BY f.date_filed DESC';

    const [rows] = await db.execute(query, params);
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('getAllFIRs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch FIRs.' });
  }
};

// ── GET /api/fir/:id ──────────────────────────────────────────
const getFIRById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT f.*,
              s.name AS station_name,
              d.name AS district_name,
              o.name AS registered_by,
              c.case_id, c.status AS case_status, c.priority
       FROM FIR f
       JOIN Station    s ON f.station_id  = s.station_id
       JOIN District   d ON s.district_id = d.district_id
       JOIN Officer    o ON f.officer_id  = o.officer_id
       LEFT JOIN CrimeCase c ON c.fir_id = f.fir_id
       WHERE f.fir_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'FIR not found.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch FIR.' });
  }
};

// ── POST /api/fir ─────────────────────────────────────────────
// Calls stored procedure file_fir() — REPEATABLE READ
// Trigger 1 auto-creates CrimeCase + CaseOfficer + InvestigationLog
const createFIR = async (req, res) => {
  const {
    complainant_name, complainant_contact, complainant_address,
    incident_date, incident_location, description,
    station_id, officer_id
  } = req.body;

  // Basic validation
  if (!complainant_name || !incident_date || !incident_location || !description || !station_id || !officer_id) {
    return res.status(400).json({
      success: false,
      message: 'complainant_name, incident_date, incident_location, description, station_id, officer_id are required.'
    });
  }

  // Officers can only file FIRs at their own station
  if (req.user.role === 'officer' && parseInt(station_id) !== req.user.station_id) {
    return res.status(403).json({
      success: false,
      message: 'Officers can only file FIRs for their own station.'
    });
  }

  const conn = await db.getConnection();
  try {
    // Call file_fir() stored procedure
    await conn.execute(
      `CALL file_fir(NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 'open', @fir_id, @case_id, @msg)`,
      [
        complainant_name,
        complainant_contact  || null,
        complainant_address  || null,
        incident_date,
        incident_location,
        description,
        station_id,
        officer_id
      ]
    );

    const [[result]] = await conn.execute(
      'SELECT @fir_id AS fir_id, @case_id AS case_id, @msg AS message'
    );

    if (!result.fir_id) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to file FIR.'
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        fir_id:  result.fir_id,
        case_id: result.case_id
      }
    });
  } catch (err) {
    console.error('createFIR error:', err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || 'Failed to file FIR.'
    });
  } finally {
    conn.release();
  }
};

// ── PUT /api/fir/:id/status ───────────────────────────────────
const updateFIRStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'under_investigation', 'closed', 'false_report'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }
  try {
    await db.execute('UPDATE FIR SET status = ? WHERE fir_id = ?', [status, req.params.id]);
    return res.status(200).json({ success: true, message: `FIR status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update FIR.' });
  }
};

module.exports = { getAllFIRs, getFIRById, createFIR, updateFIRStatus };
