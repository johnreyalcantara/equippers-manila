require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Static files — serve the existing site and new pages
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check — test DB connection (visit /api/health in browser)
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as ok');
    const [tables] = await pool.execute("SHOW TABLES");
    res.json({
      status: 'connected',
      tables: tables.map(t => Object.values(t)[0]),
      db_host: process.env.DB_HOST,
      ssl: process.env.DB_SSL
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      error: err.message,
      code: err.code,
      db_host: process.env.DB_HOST,
      ssl: process.env.DB_SSL
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/verses', require('./routes/verses'));
app.use('/api/admin', require('./routes/admin'));

// Seed admin account if it doesn't exist
async function seedAdmin() {
  try {
    const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', ['eqprs_admin']);
    if (rows.length === 0) {
      const hash = await bcrypt.hash('eqprs_mnl_2026!', 12);
      await pool.execute(
        'INSERT INTO users (name, age, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 0, 'admin@equippersmanila.com', 'eqprs_admin', hash, 'ADMIN']
      );
      console.log('Admin account seeded.');
    }
  } catch (err) {
    console.error('Seed admin error:', err.message);
  }
}

// Local development — start the server
// On Vercel, this file is imported by api/index.js instead
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await seedAdmin();
  });
}

// Export for Vercel serverless function
module.exports = app;
module.exports.seedAdmin = seedAdmin;
