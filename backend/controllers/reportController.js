// controllers/reportController.js
const db = require('../config/db');

// ── GET /api/reports/dashboard ────────────────────────────────
// Role-filtered dashboard statistics
const getDashboard = async (req, res) => {
  try {
    let stationWhere = '';
    const params = [];

    if (req.user.role === 'officer' && req.user.station_id) {
      stationWhere = 'AND f.station_id = ?';
      params.push(req.user.station_id);
    }

    // Case counts
    const [caseCounts] = await db.execute(
      `SELECT
         COUNT(*)                                                        AS total_cases,
         SUM(CASE WHEN cc.status = 'open'          THEN 1 ELSE 0 END)  AS open_cases,
         SUM(CASE WHEN cc.status = 'investigating' THEN 1 ELSE 0 END)  AS investigating,
         SUM(CASE WHEN cc.status = 'pending_trial' THEN 1 ELSE 0 END)  AS pending_trial,
         SUM(CASE WHEN cc.status = 'closed'        THEN 1 ELSE 0 END)  AS closed_cases
       FROM CrimeCase cc
       JOIN FIR f ON cc.fir_id = f.fir_id
       WHERE 1=1 ${stationWhere}`,
      params
    );

    // FIR counts
    const [firCounts] = await db.execute(
      `SELECT
         COUNT(*)                                                        AS total_firs,
         SUM(CASE WHEN status = 'open'   THEN 1 ELSE 0 END)            AS open_firs,
         SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)            AS closed_firs
       FROM FIR
       WHERE 1=1 ${stationWhere.replace('f.station_id', 'station_id')}`,
      params
    );

    // Arrest counts
    const [arrestCounts] = await db.execute(
      `SELECT COUNT(*) AS total_arrests
       FROM Arrest a
       JOIN CrimeCase cc ON a.case_id = cc.case_id
       JOIN FIR f ON cc.fir_id = f.fir_id
       WHERE 1=1 ${stationWhere}`,
      params
    );

    // Evidence counts
    const [evidenceCounts] = await db.execute(
      `SELECT
         COUNT(*)                                                        AS total_evidence,
         SUM(CASE WHEN e.status = 'sealed' THEN 1 ELSE 0 END)          AS sealed_evidence
       FROM Evidence e
       JOIN CrimeCase cc ON e.case_id = cc.case_id
       JOIN FIR f ON cc.fir_id = f.fir_id
       WHERE 1=1 ${stationWhere}`,
      params
    );

    // 5 most recent FIRs
    const [recentFIRs] = await db.execute(
      `SELECT f.fir_id, f.complainant_name, f.incident_location,
              f.date_filed, f.status,
              s.name AS station,
              cc.case_id, cc.status AS case_status
       FROM FIR f
       JOIN Station s ON f.station_id = s.station_id
       LEFT JOIN CrimeCase cc ON cc.fir_id = f.fir_id
       ORDER BY f.date_filed DESC LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      data: {
        cases:       caseCounts[0],
        firs:        firCounts[0],
        arrests:     arrestCounts[0],
        evidence:    evidenceCounts[0],
        recent_firs: recentFIRs
      }
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard.' });
  }
};

// ── GET /api/reports/station/:id ──────────────────────────────
// Full station summary report
const getStationReport = async (req, res) => {
  const stationId = req.params.id;
  try {
    // Station info
    const [station] = await db.execute(
      `SELECT s.*, d.name AS district, d.state
       FROM Station s JOIN District d ON s.district_id = d.district_id
       WHERE s.station_id = ?`,
      [stationId]
    );
    if (station.length === 0) {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }

    // Case stats
    const [caseStats] = await db.execute(
      `SELECT cc.status, cc.priority, COUNT(*) AS count
       FROM CrimeCase cc
       JOIN FIR f ON cc.fir_id = f.fir_id
       WHERE f.station_id = ?
       GROUP BY cc.status, cc.priority
       ORDER BY cc.status`,
      [stationId]
    );

    // Officer workload for this station
    const [workload] = await db.execute(
      `SELECT * FROM vw_officer_workload
       WHERE station_name = (SELECT name FROM Station WHERE station_id = ?)
       ORDER BY active_assigned_cases DESC`,
      [stationId]
    );

    // Evidence summary
    const [evidenceSummary] = await db.execute(
      `SELECT e.type, e.status, COUNT(*) AS count
       FROM Evidence e
       JOIN CrimeCase cc ON e.case_id  = cc.case_id
       JOIN FIR f        ON cc.fir_id  = f.fir_id
       WHERE f.station_id = ?
       GROUP BY e.type, e.status`,
      [stationId]
    );

    // Recent arrests
    const [recentArrests] = await db.execute(
      `SELECT a.arrest_id, a.arrest_date, a.location,
              s.name AS suspect_name,
              o.name AS arresting_officer
       FROM Arrest a
       JOIN Suspect     s  ON a.suspect_id = s.suspect_id
       JOIN Officer     o  ON a.officer_id = o.officer_id
       JOIN CrimeCase   cc ON a.case_id    = cc.case_id
       JOIN FIR         f  ON cc.fir_id    = f.fir_id
       WHERE f.station_id = ?
       ORDER BY a.arrest_date DESC LIMIT 10`,
      [stationId]
    );

    return res.status(200).json({
      success: true,
      data: {
        station:          station[0],
        case_stats:       caseStats,
        officer_workload: workload,
        evidence_summary: evidenceSummary,
        recent_arrests:   recentArrests
      }
    });
  } catch (err) {
    console.error('getStationReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
};

module.exports = { getDashboard, getStationReport };
