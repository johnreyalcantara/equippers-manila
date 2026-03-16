const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireLeaderOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/e-groups — public list
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT g.*, u.name as leader_name,
        (SELECT COUNT(*) FROM e_group_members m WHERE m.group_id = g.id) as total_members
       FROM e_groups g JOIN users u ON g.leader_user_id = u.id
       ORDER BY g.name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/e-groups — leader or admin creates group
router.post('/', verifyToken, requireLeaderOrAdmin, async (req, res) => {
  try {
    const { name, description, meeting_day, meeting_location } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required.' });

    const leader_id = req.user.id;
    const [result] = await pool.execute(
      'INSERT INTO e_groups (name, description, meeting_day, meeting_location, leader_user_id) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, meeting_day || null, meeting_location || null, leader_id]
    );
    await pool.execute(
      'INSERT INTO chat_rooms (name, type, ref_id) VALUES (?, "EGROUP", ?)',
      ['EGROUP_' + name.replace(/\s+/g, ''), result.insertId]
    );
    await pool.execute('INSERT IGNORE INTO e_group_members (group_id, user_id) VALUES (?, ?)', [result.insertId, leader_id]);
    res.status(201).json({ message: 'E-Group created.' });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/e-groups/apply — user applies to join
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { group_id } = req.body;
    if (!group_id) return res.status(400).json({ error: 'Group ID required.' });
    const [existing] = await pool.execute('SELECT id FROM e_group_members WHERE group_id = ? AND user_id = ?', [group_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Already a member.' });
    const [pending] = await pool.execute('SELECT id FROM e_group_requests WHERE group_id = ? AND user_id = ? AND status = "PENDING"', [group_id, req.user.id]);
    if (pending.length > 0) return res.status(400).json({ error: 'Request already pending.' });

    await pool.execute('INSERT INTO e_group_requests (group_id, user_id) VALUES (?, ?)', [group_id, req.user.id]);
    res.status(201).json({ message: 'Join request submitted.' });
  } catch (err) {
    console.error('Apply group error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/e-groups/:id/requests — leader views pending requests
router.get('/:id/requests', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name, u.username FROM e_group_requests r
       JOIN users u ON r.user_id = u.id WHERE r.group_id = ? AND r.status = 'PENDING'`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// POST /api/e-groups/requests/:requestId/approve
router.post('/requests/:requestId/approve', verifyToken, async (req, res) => {
  try {
    const [reqRow] = await pool.execute('SELECT * FROM e_group_requests WHERE id = ?', [req.params.requestId]);
    if (reqRow.length === 0) return res.status(404).json({ error: 'Request not found.' });
    const r = reqRow[0];
    await pool.execute('UPDATE e_group_requests SET status = "APPROVED" WHERE id = ?', [r.id]);
    await pool.execute('INSERT IGNORE INTO e_group_members (group_id, user_id) VALUES (?, ?)', [r.group_id, r.user_id]);
    res.json({ message: 'Request approved.' });
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// POST /api/e-groups/requests/:requestId/reject
router.post('/requests/:requestId/reject', verifyToken, async (req, res) => {
  try {
    await pool.execute('UPDATE e_group_requests SET status = "REJECTED" WHERE id = ?', [req.params.requestId]);
    res.json({ message: 'Request rejected.' });
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// GET /api/e-groups/:id/members
router.get('/:id/members', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, u.name, u.username FROM e_group_members m JOIN users u ON m.user_id = u.id WHERE m.group_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

module.exports = router;
