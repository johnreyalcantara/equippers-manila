const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/e-hubs — public list
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT h.*, u.name as leader_name,
        (SELECT COUNT(*) FROM e_hub_members m WHERE m.hub_id = h.id) as total_members
       FROM e_hubs h JOIN users u ON h.leader_user_id = u.id
       ORDER BY h.name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get hubs error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/e-hubs — admin creates hub
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, leader_user_id } = req.body;
    if (!name || !leader_user_id) return res.status(400).json({ error: 'Name and leader required.' });

    const [result] = await pool.execute(
      'INSERT INTO e_hubs (name, description, leader_user_id) VALUES (?, ?, ?)',
      [name, description || null, leader_user_id]
    );
    await pool.execute(
      'INSERT INTO chat_rooms (name, type, ref_id) VALUES (?, "EHUB", ?)',
      ['E-HUB_' + name.replace(/\s+/g, ''), result.insertId]
    );
    await pool.execute('INSERT IGNORE INTO e_hub_members (hub_id, user_id) VALUES (?, ?)', [result.insertId, leader_user_id]);
    res.status(201).json({ message: 'E-Hub created.' });
  } catch (err) {
    console.error('Create hub error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/e-hubs/apply — user applies to join
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { hub_id } = req.body;
    if (!hub_id) return res.status(400).json({ error: 'Hub ID required.' });
    const [existing] = await pool.execute('SELECT id FROM e_hub_members WHERE hub_id = ? AND user_id = ?', [hub_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Already a member.' });
    const [pending] = await pool.execute('SELECT id FROM e_hub_requests WHERE hub_id = ? AND user_id = ? AND status = "PENDING"', [hub_id, req.user.id]);
    if (pending.length > 0) return res.status(400).json({ error: 'Request already pending.' });

    await pool.execute('INSERT INTO e_hub_requests (hub_id, user_id) VALUES (?, ?)', [hub_id, req.user.id]);
    res.status(201).json({ message: 'Join request submitted.' });
  } catch (err) {
    console.error('Apply hub error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/e-hubs/:id/requests — leader views pending requests
router.get('/:id/requests', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name, u.username FROM e_hub_requests r
       JOIN users u ON r.user_id = u.id WHERE r.hub_id = ? AND r.status = 'PENDING'`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// POST /api/e-hubs/requests/:requestId/approve
router.post('/requests/:requestId/approve', verifyToken, async (req, res) => {
  try {
    const [reqRow] = await pool.execute('SELECT * FROM e_hub_requests WHERE id = ?', [req.params.requestId]);
    if (reqRow.length === 0) return res.status(404).json({ error: 'Request not found.' });
    const r = reqRow[0];
    await pool.execute('UPDATE e_hub_requests SET status = "APPROVED" WHERE id = ?', [r.id]);
    await pool.execute('INSERT IGNORE INTO e_hub_members (hub_id, user_id) VALUES (?, ?)', [r.hub_id, r.user_id]);
    res.json({ message: 'Request approved.' });
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// POST /api/e-hubs/requests/:requestId/reject
router.post('/requests/:requestId/reject', verifyToken, async (req, res) => {
  try {
    await pool.execute('UPDATE e_hub_requests SET status = "REJECTED" WHERE id = ?', [req.params.requestId]);
    res.json({ message: 'Request rejected.' });
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// GET /api/e-hubs/:id/members
router.get('/:id/members', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, u.name, u.username FROM e_hub_members m JOIN users u ON m.user_id = u.id WHERE m.hub_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

module.exports = router;
