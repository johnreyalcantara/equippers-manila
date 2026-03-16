const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/announcements — public, list all announcements
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as author_name
       FROM announcements a JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Announcements error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/announcements — admin creates announcement
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, event_date, location, image_url } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required.' });
    }
    await pool.execute(
      'INSERT INTO announcements (title, description, event_date, location, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, event_date || null, location || null, image_url || null, req.user.id]
    );
    res.status(201).json({ message: 'Announcement created.' });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE /api/announcements/:id — admin deletes announcement
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
