const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/services/upcoming — list upcoming services
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE service_date >= CURDATE() ORDER BY service_date, service_time',
    );
    res.json(rows);
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/services — admin creates a service
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, service_date, service_time, max_seats } = req.body;
    if (!service_date || !service_time) {
      return res.status(400).json({ error: 'Date and time are required.' });
    }
    await pool.execute(
      'INSERT INTO services (title, service_date, service_time, max_seats) VALUES (?, ?, ?, ?)',
      [title || 'Sunday Service', service_date, service_time, max_seats || 200]
    );
    res.status(201).json({ message: 'Service created.' });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
