const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/photos/request — request photo coverage
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { service_id } = req.body;
    if (!service_id) return res.status(400).json({ error: 'Service ID required.' });

    await pool.execute(
      'INSERT INTO photo_requests (user_id, service_id) VALUES (?, ?)',
      [req.user.id, service_id]
    );
    res.status(201).json({ message: 'Photo request submitted.' });
  } catch (err) {
    console.error('Photo request error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/photos/album — get user's photos
router.get('/album', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, s.service_date, s.service_time
       FROM photos p JOIN services s ON p.service_id = s.id
       WHERE p.user_id = ?
       ORDER BY p.uploaded_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get album error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/photos/requests — get user's photo requests
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT pr.*, s.service_date, s.service_time
       FROM photo_requests pr JOIN services s ON pr.service_id = s.id
       WHERE pr.user_id = ?
       ORDER BY pr.requested_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
