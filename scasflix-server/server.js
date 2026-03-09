/**
 * server.js
 * SCASFLIX — Main Express Server
 */
const PORT = process.env.PORT || 10000;
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: '*' })); // Restrict to your domain in production
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/tmdb', require('./routes/tmdb'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/list', require('./routes/list'));
app.use('/api/profiles', require('./routes/profiles'));

// ── Health check ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'SCASFLIX Server is running ✅' });
});

// ── MongoDB + Start ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 SCASFLIX server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
