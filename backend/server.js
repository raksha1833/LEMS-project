// server.js

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

// ── Global Middleware ─────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000','http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (shows every API call in terminal)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]  ${req.method}  ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/fir',      require('./routes/firRoutes'));
app.use('/api/cases',    require('./routes/caseRoutes'));
app.use('/api/officers', require('./routes/officerRoutes'));
app.use('/api/suspects', require('./routes/suspectRoutes'));
app.use('/api/evidence', require('./routes/evidenceRoutes'));
app.use('/api/charges',  require('./routes/chargeRoutes'));
app.use('/api/reports',  require('./routes/reportRoutes'));

// ── Utility routes (no separate file needed) ──────────────────
const verifyToken = require('./middleware/auth');
const db          = require('./config/db');

// GET /api/districts
app.get('/api/districts', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM District ORDER BY name');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch districts.' });
  }
});

// GET /api/stations
app.get('/api/stations', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, d.name AS district
       FROM Station s
       JOIN District d ON s.district_id = d.district_id
       ORDER BY s.name`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stations.' });
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'LEMS API is running',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`
  });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀  LEMS Backend running on http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nAvailable routes:');
  console.log('  GET    /api/health');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/fir');
  console.log('  POST   /api/fir                  ← calls file_fir() SP');
  console.log('  GET    /api/cases');
  console.log('  GET    /api/cases/timeline');
  console.log('  GET    /api/cases/:id');
  console.log('  PUT    /api/cases/:id/close       ← calls close_case() SP');
  console.log('  GET    /api/officers');
  console.log('  GET    /api/officers/workload     ← uses vw_officer_workload');
  console.log('  GET    /api/suspects');
  console.log('  POST   /api/suspects/arrest       ← calls arrest_suspect() SP');
  console.log('  GET    /api/evidence');
  console.log('  GET    /api/charges');
  console.log('  GET    /api/charges/legal-sections');
  console.log('  GET    /api/reports/dashboard');
  console.log('  GET    /api/reports/station/:id');
  console.log('  GET    /api/districts');
  console.log('  GET    /api/stations');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
