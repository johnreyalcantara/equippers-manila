const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, age, email, username, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/users/me — update profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    const { name, age, email, username, password } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (age) { updates.push('age = ?'); values.push(age); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (username) { updates.push('username = ?'); values.push(username); }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updates.push('password = ?');
      values.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(req.user.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already taken.' });
    }
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
