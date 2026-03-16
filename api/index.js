/**
 * Vercel Serverless Function Entry Point
 *
 * Wraps the Express app so it runs as a single serverless function.
 * Vercel routes all /api/* requests here via vercel.json.
 * Static files (HTML, CSS, JS, images) are served by Vercel natively.
 */

const app = require('../server');

// Seed admin on cold start (runs once per serverless instance)
const { seedAdmin } = require('../server');
if (seedAdmin) {
  seedAdmin().catch(err => console.error('Seed error:', err.message));
}

module.exports = app;
