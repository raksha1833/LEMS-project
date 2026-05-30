// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("REQ BODY:", req.body);

    const [users] = await db.execute(
      `SELECT 
          u.user_id,
          u.username,
          u.password_hash,
          u.role,
          u.officer_id,
          u.station_id,
          u.is_active,
          o.name AS officer_name,
          s.name AS station_name
       FROM UserLogin u
       LEFT JOIN Officer o ON u.officer_id = o.officer_id
       LEFT JOIN Station s ON u.station_id = s.station_id
       WHERE u.username = ?`,
      [username]
    );

    console.log("DB USERS:", users);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        officer_id: user.officer_id,
        station_id: user.station_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        officer_id: user.officer_id,
        station_id: user.station_id,
        officer_name: user.officer_name,
        station_name: user.station_name
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { login };

// ── GET /api/auth/me ──────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.role, u.last_login,
              o.name AS officer_name, o.status AS officer_status,
              r.title AS rank,
              s.name AS station
       FROM UserLogin u
       LEFT JOIN Officer     o ON u.officer_id  = o.officer_id
       LEFT JOIN OfficerRank r ON o.rank_id      = r.rank_id
       LEFT JOIN Station     s ON u.station_id   = s.station_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, getMe };
