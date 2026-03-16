const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/reservations — reserve a seat
router.post('/', verifyToken, async (req, res) => {
  try {
    const { service_id } = req.body;
    if (!service_id) return res.status(400).json({ error: 'Service ID required.' });

    // Check seat availability
    const [service] = await pool.execute('SELECT max_seats FROM services WHERE id = ?', [service_id]);
    if (service.length === 0) return res.status(404).json({ error: 'Service not found.' });

    const [count] = await pool.execute(
      'SELECT COUNT(*) as reserved FROM reservations WHERE service_id = ? AND status = "RESERVED"',
      [service_id]
    );
    if (count[0].reserved >= service[0].max_seats) {
      return res.status(400).json({ error: 'No seats available.' });
    }

    await pool.execute(
      'INSERT INTO reservations (user_id, service_id, status) VALUES (?, ?, "RESERVED") ON DUPLICATE KEY UPDATE status = "RESERVED", reserved_at = CURRENT_TIMESTAMP',
      [req.user.id, service_id]
    );
    res.json({ message: 'Seat reserved.' });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/reservations/:serviceId — cancel reservation
router.delete('/:serviceId', verifyToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE reservations SET status = "CANCELLED" WHERE user_id = ? AND service_id = ?',
      [req.user.id, req.params.serviceId]
    );
    res.json({ message: 'Reservation cancelled.' });
  } catch (err) {
    console.error('Cancel reservation error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reservations/mine — get user's reservations
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, s.service_date, s.service_time, s.title
       FROM reservations r JOIN services s ON r.service_id = s.id
       WHERE r.user_id = ? AND r.status = 'RESERVED' AND s.service_date >= CURDATE()
       ORDER BY s.service_date`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get reservations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
