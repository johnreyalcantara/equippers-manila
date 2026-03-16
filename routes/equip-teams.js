const express = require('express');
const pool = require('../config/db');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/equip-teams — public list (name, description, leader, total_members)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, u.name as leader_name,
        (SELECT COUNT(*) FROM equip_team_members m WHERE m.team_id = t.id) as total_members
       FROM equip_teams t JOIN users u ON t.leader_user_id = u.id
       ORDER BY t.name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/equip-teams — admin creates team
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, leader_user_id } = req.body;
    if (!name || !leader_user_id) {
      return res.status(400).json({ error: 'Name and leader required.' });
    }
    const [result] = await pool.execute(
      'INSERT INTO equip_teams (name, description, leader_user_id) VALUES (?, ?, ?)',
      [name, description || null, leader_user_id]
    );
    // Auto-create chat room
    await pool.execute(
      'INSERT INTO chat_rooms (name, type, ref_id) VALUES (?, "EQUIPTEAM", ?)',
      ['EQUIPTEAM_' + name.replace(/\s+/g, ''), result.insertId]
    );
    // Auto-add leader as member
    await pool.execute(
      'INSERT IGNORE INTO equip_team_members (team_id, user_id) VALUES (?, ?)',
      [result.insertId, leader_user_id]
    );
    res.status(201).json({ message: 'Equip Team created.' });
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/equip-teams/apply — user applies to join
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ error: 'Team ID required.' });
    // Check not already a member
    const [existing] = await pool.execute(
      'SELECT id FROM equip_team_members WHERE team_id = ? AND user_id = ?', [team_id, req.user.id]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Already a member.' });
    // Check no pending request
    const [pending] = await pool.execute(
      'SELECT id FROM equip_team_requests WHERE team_id = ? AND user_id = ? AND status = "PENDING"', [team_id, req.user.id]
    );
    if (pending.length > 0) return res.status(400).json({ error: 'Request already pending.' });

    await pool.execute(
      'INSERT INTO equip_team_requests (team_id, user_id) VALUES (?, ?)',
      [team_id, req.user.id]
    );
    res.status(201).json({ message: 'Join request submitted.' });
  } catch (err) {
    console.error('Apply team error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/equip-teams/:id/requests — leader views pending requests
router.get('/:id/requests', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name, u.username FROM equip_team_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.team_id = ? AND r.status = 'PENDING'
       ORDER BY r.requested_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get team requests error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/equip-teams/requests/:requestId/approve — leader approves
router.post('/requests/:requestId/approve', verifyToken, async (req, res) => {
  try {
    const [reqRow] = await pool.execute('SELECT * FROM equip_team_requests WHERE id = ?', [req.params.requestId]);
    if (reqRow.length === 0) return res.status(404).json({ error: 'Request not found.' });
    const r = reqRow[0];

    await pool.execute('UPDATE equip_team_requests SET status = "APPROVED" WHERE id = ?', [r.id]);
    await pool.execute('INSERT IGNORE INTO equip_team_members (team_id, user_id) VALUES (?, ?)', [r.team_id, r.user_id]);
    res.json({ message: 'Request approved.' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/equip-teams/requests/:requestId/reject — leader rejects
router.post('/requests/:requestId/reject', verifyToken, async (req, res) => {
  try {
    await pool.execute('UPDATE equip_team_requests SET status = "REJECTED" WHERE id = ?', [req.params.requestId]);
    res.json({ message: 'Request rejected.' });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/equip-teams/:id/members — list members
router.get('/:id/members', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, u.name, u.username FROM equip_team_members m
       JOIN users u ON m.user_id = u.id WHERE m.team_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
