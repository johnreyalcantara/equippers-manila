const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: 'uploads/photos/',
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper: build date filter SQL clause
function dateFilter(column, filter, from, to) {
  switch (filter) {
    case 'today': return { sql: `DATE(${column}) = CURDATE()`, params: [] };
    case 'week': return { sql: `YEARWEEK(${column},1) = YEARWEEK(CURDATE(),1)`, params: [] };
    case 'month': return { sql: `YEAR(${column}) = YEAR(CURDATE()) AND MONTH(${column}) = MONTH(CURDATE())`, params: [] };
    case 'year': return { sql: `YEAR(${column}) = YEAR(CURDATE())`, params: [] };
    case 'custom':
      if (from && to) return { sql: `DATE(${column}) BETWEEN ? AND ?`, params: [from, to] };
      return { sql: '1=1', params: [] };
    default: return { sql: '1=1', params: [] };
  }
}

// GET /api/admin/stats — dashboard summary
router.get('/stats', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT COUNT(*) as c FROM users WHERE role = "USER"');
    const [attendance] = await pool.execute('SELECT COUNT(*) as c FROM attendance WHERE status = "ATTENDING"');
    const [reservations] = await pool.execute('SELECT COUNT(*) as c FROM reservations WHERE status = "RESERVED"');
    const [donations] = await pool.execute('SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as c FROM donations');

    // CRM stats
    const [teams] = await pool.execute('SELECT COUNT(*) as c FROM equip_teams');
    const [hubs] = await pool.execute('SELECT COUNT(*) as c FROM e_hubs');
    const [groups] = await pool.execute('SELECT COUNT(*) as c FROM e_groups');
    const [joinReqs] = await pool.execute(
      `SELECT (SELECT COUNT(*) FROM equip_team_requests WHERE status='PENDING') +
              (SELECT COUNT(*) FROM e_hub_requests WHERE status='PENDING') +
              (SELECT COUNT(*) FROM e_group_requests WHERE status='PENDING') as c`
    );

    res.json({
      totalUsers: users[0].c,
      totalAttendees: attendance[0].c,
      totalReservations: reservations[0].c,
      totalDonations: donations[0].total,
      donationCount: donations[0].c,
      totalTeams: teams[0].c,
      totalHubs: hubs[0].c,
      totalGroups: groups[0].c,
      totalJoinRequests: joinReqs[0].c
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/charts — chart data
router.get('/charts', async (req, res) => {
  try {
    // Attendance per service (last 8)
    const [attChart] = await pool.execute(
      `SELECT s.service_date, s.service_time, COUNT(a.id) as count
       FROM services s LEFT JOIN attendance a ON s.id = a.service_id AND a.status = 'ATTENDING'
       GROUP BY s.id ORDER BY s.service_date DESC LIMIT 8`
    );

    // VIP (new attendees) per service (last 8)
    const [vipChart] = await pool.execute(
      `SELECT s.service_date, s.service_time, COUNT(a.id) as count
       FROM services s LEFT JOIN attendance a ON s.id = a.service_id AND a.status = 'ATTENDING' AND a.type = 'VIP'
       GROUP BY s.id ORDER BY s.service_date DESC LIMIT 8`
    );

    // Donation trend (last 12 weeks)
    const [donChart] = await pool.execute(
      `SELECT YEARWEEK(donated_at, 1) as week, SUM(amount) as total
       FROM donations GROUP BY week ORDER BY week DESC LIMIT 12`
    );

    res.json({
      attendance: attChart.reverse(),
      vip: vipChart.reverse(),
      donations: donChart.reverse()
    });
  } catch (err) {
    console.error('Admin charts error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/users — users list
router.get('/users', async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const df = dateFilter('created_at', filter, from, to);
    const [rows] = await pool.execute(
      `SELECT id, name, age, email, username, role, created_at FROM users WHERE ${df.sql} ORDER BY created_at DESC`,
      df.params
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/attendance — attendance list
router.get('/attendance', async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const df = dateFilter('a.marked_at', filter, from, to);
    const [rows] = await pool.execute(
      `SELECT a.*, u.name, u.username, s.service_date, s.service_time
       FROM attendance a JOIN users u ON a.user_id = u.id JOIN services s ON a.service_id = s.id
       WHERE ${df.sql} ORDER BY a.marked_at DESC`,
      df.params
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin attendance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/reservations — reservations list
router.get('/reservations', async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const df = dateFilter('r.reserved_at', filter, from, to);
    const [rows] = await pool.execute(
      `SELECT r.*, u.name, u.username, s.service_date, s.service_time
       FROM reservations r JOIN users u ON r.user_id = u.id JOIN services s ON r.service_id = s.id
       WHERE ${df.sql} ORDER BY r.reserved_at DESC`,
      df.params
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin reservations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/donations — donations list
router.get('/donations', async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const df = dateFilter('d.donated_at', filter, from, to);
    const [rows] = await pool.execute(
      `SELECT d.*, u.name, u.username
       FROM donations d JOIN users u ON d.user_id = u.id
       WHERE ${df.sql} ORDER BY d.donated_at DESC`,
      df.params
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin donations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/photo-requests — photo requests list
router.get('/photo-requests', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT pr.*, u.name, u.username, s.service_date, s.service_time
       FROM photo_requests pr JOIN users u ON pr.user_id = u.id JOIN services s ON pr.service_id = s.id
       ORDER BY pr.requested_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin photo requests error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/photos/upload — upload and assign photo to user
router.post('/photos/upload', upload.single('photo'), async (req, res) => {
  try {
    const { user_id, service_id } = req.body;
    if (!req.file || !user_id || !service_id) {
      return res.status(400).json({ error: 'Photo, user ID, and service ID required.' });
    }
    await pool.execute(
      'INSERT INTO photos (user_id, service_id, file_path) VALUES (?, ?, ?)',
      [user_id, service_id, '/uploads/photos/' + req.file.filename]
    );
    // Mark photo request as completed if exists
    await pool.execute(
      'UPDATE photo_requests SET status = "COMPLETED" WHERE user_id = ? AND service_id = ?',
      [user_id, service_id]
    );
    res.status(201).json({ message: 'Photo uploaded and assigned.' });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/services-list — all services (for dropdowns and tables)
router.get('/services-list', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*,
        (SELECT COUNT(*) FROM attendance a WHERE a.service_id = s.id AND a.status = 'ATTENDING') as attendee_count,
        (SELECT COUNT(*) FROM attendance a WHERE a.service_id = s.id AND a.status = 'ATTENDING' AND a.type = 'VIP') as vip_count,
        (SELECT COUNT(*) FROM reservations r WHERE r.service_id = s.id AND r.status = 'RESERVED') as reservation_count
       FROM services s ORDER BY s.service_date DESC, s.service_time DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin services list error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/users-list — minimal users list (for dropdowns)
router.get('/users-list', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, username FROM users WHERE role = "USER" ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/services — create a new service
router.post('/services', async (req, res) => {
  try {
    const { title, service_date, service_time, max_seats } = req.body;
    if (!service_date || !service_time) {
      return res.status(400).json({ error: 'Date and time required.' });
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

// PUT /api/admin/users/:id/role — assign role to user
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['USER', 'LEADER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be USER, LEADER, or ADMIN.' });
    }
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Role updated to ' + role + '.' });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
