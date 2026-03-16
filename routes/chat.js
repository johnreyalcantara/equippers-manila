const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/chat/rooms — get chat rooms user belongs to
router.get('/rooms', verifyToken, async (req, res) => {
  try {
    const uid = req.user.id;
    // Get rooms from teams, hubs, and groups the user is a member of
    const [rows] = await pool.execute(
      `SELECT cr.* FROM chat_rooms cr WHERE
        (cr.type = 'EQUIPTEAM' AND cr.ref_id IN (SELECT team_id FROM equip_team_members WHERE user_id = ?))
        OR (cr.type = 'EHUB' AND cr.ref_id IN (SELECT hub_id FROM e_hub_members WHERE user_id = ?))
        OR (cr.type = 'EGROUP' AND cr.ref_id IN (SELECT group_id FROM e_group_members WHERE user_id = ?))
       ORDER BY cr.name`,
      [uid, uid, uid]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/chat/rooms/:roomId/messages — get message history
router.get('/rooms/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [rows] = await pool.execute(
      `SELECT cm.*, u.name as sender_name, u.username as sender_username
       FROM chat_messages cm JOIN users u ON cm.user_id = u.id
       WHERE cm.room_id = ?
       ORDER BY cm.created_at DESC LIMIT ?`,
      [req.params.roomId, limit]
    );
    res.json(rows.reverse()); // Return in chronological order
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/chat/rooms/:roomId/messages — send a message
router.post('/rooms/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message required.' });

    await pool.execute(
      'INSERT INTO chat_messages (room_id, user_id, message) VALUES (?, ?, ?)',
      [req.params.roomId, req.user.id, message.trim()]
    );
    res.status(201).json({ message: 'Sent.' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
