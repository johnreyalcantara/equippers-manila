const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/attendance — mark as attending
router.post('/', verifyToken, async (req, res) => {
  try {
    const { service_id } = req.body;
    if (!service_id) return res.status(400).json({ error: 'Service ID required.' });

    await pool.execute(
      'INSERT INTO attendance (user_id, service_id, status) VALUES (?, ?, "ATTENDING") ON DUPLICATE KEY UPDATE status = "ATTENDING", marked_at = CURRENT_TIMESTAMP',
      [req.user.id, service_id]
    );
    res.json({ message: 'Marked as attending.' });
  } catch (err) {
    console.error('Attendance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/attendance/:serviceId — cancel attendance
router.delete('/:serviceId', verifyToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE attendance SET status = "CANCELLED" WHERE user_id = ? AND service_id = ?',
      [req.user.id, req.params.serviceId]
    );
    res.json({ message: 'Attendance cancelled.' });
  } catch (err) {
    console.error('Cancel attendance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/attendance/streak — get attendance streak + total
router.get('/streak', verifyToken, async (req, res) => {
  try {
    // Total services attended
    const [totalRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM attendance WHERE user_id = ? AND status = "ATTENDING"',
      [req.user.id]
    );

    // Get distinct weeks attended, ordered descending
    const [weeks] = await pool.execute(
      `SELECT DISTINCT YEARWEEK(s.service_date, 1) as yw
       FROM attendance a
       JOIN services s ON a.service_id = s.id
       WHERE a.user_id = ? AND a.status = 'ATTENDING'
       ORDER BY yw DESC`,
      [req.user.id]
    );

    // Calculate streak: count consecutive weeks from current week backwards
    let streak = 0;
    if (weeks.length > 0) {
      // Get current year-week
      const [nowRow] = await pool.execute('SELECT YEARWEEK(CURDATE(), 1) as currentWeek');
      let expectedWeek = parseInt(nowRow[0].currentWeek);

      for (const row of weeks) {
        const yw = parseInt(row.yw);
        if (yw === expectedWeek || yw === expectedWeek - 1) {
          streak++;
          expectedWeek = yw - 1;
          // Handle year boundary (week 01 of new year)
          const weekNum = expectedWeek % 100;
          if (weekNum < 1) {
            expectedWeek = (Math.floor(expectedWeek / 100) - 1) * 100 + 52;
          }
        } else {
          break;
        }
      }
    }

    // Get user's attendance for upcoming services
    const [myAttendance] = await pool.execute(
      `SELECT a.*, s.service_date, s.service_time
       FROM attendance a JOIN services s ON a.service_id = s.id
       WHERE a.user_id = ? AND s.service_date >= CURDATE() AND a.status = 'ATTENDING'`,
      [req.user.id]
    );

    res.json({
      total: totalRows[0].total,
      streak,
      upcoming: myAttendance
    });
  } catch (err) {
    console.error('Streak error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
