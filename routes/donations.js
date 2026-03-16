const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/donations — submit donation record
router.post('/', verifyToken, async (req, res) => {
  try {
    const { amount, reference_number, message } = req.body;
    if (!amount || !reference_number) {
      return res.status(400).json({ error: 'Amount and reference number required.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0.' });
    }

    await pool.execute(
      'INSERT INTO donations (user_id, amount, reference_number, message) VALUES (?, ?, ?, ?)',
      [req.user.id, amount, reference_number, message || null]
    );
    res.status(201).json({ message: 'Donation recorded. Thank you!' });
  } catch (err) {
    console.error('Donation error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/donations/mine — get user's donations
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM donations WHERE user_id = ? ORDER BY donated_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get donations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
