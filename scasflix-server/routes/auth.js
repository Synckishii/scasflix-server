/**
 * routes/auth.js
 * SCASFLIX — Signup / Signin Routes
 */

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const AVATAR_COLORS = ['#e50914', '#0071eb', '#2ecc71', '#f39c12'];

// ── Validation helpers ───────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── POST /api/auth/signup ────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    let { name, email, password, confirm, agreed } = req.body;
    name  = (name  || '').trim();
    email = (email || '').trim().toLowerCase();

    // Validation
    if (!name || !email || !password || !confirm) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (name.length < 2) {
      return res.status(400).json({ error: 'Please enter a valid full name.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password needs at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password needs at least one number.' });
    }
    if (password !== confirm) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!agreed) {
      return res.status(400).json({ error: 'You must agree to the Terms of Use.' });
    }

    // Check duplicate
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'An account with that email already exists.' });
    }

    // Hash password
    const hash      = await bcrypt.hash(password, 10);
    const firstName = name.split(' ')[0];

    // Create default profiles
    const profiles = AVATAR_COLORS.map((color, i) => ({
      slot:   i + 1,
      name:   `${firstName} ${i + 1}`,
      color,
      pin:    null,
      locked: false
    }));

    const newUser = await User.create({ name, email, password: hash, profiles });

    res.status(201).json({ ok: true, name: newUser.name });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/signin ────────────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        profiles: user.profiles,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/signout ───────────────────────────────────────────
// JWT is stateless — client just removes the token.
// This endpoint exists for consistency / future token blacklisting.
router.post('/signout', (req, res) => {
  res.json({ ok: true, message: 'Signed out. Please clear your token on the client.' });
});

module.exports = router;
