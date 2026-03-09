/**
 * routes/profiles.js
 * SCASFLIX — Profile Management Routes (requires JWT)
 */

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

router.use(auth);

// ── GET /api/profiles — Get all profiles for current user ────────────
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('profiles');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user.profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/profiles/:slot/rename ───────────────────────────────────
router.put('/:slot/rename', async (req, res) => {
  try {
    let { name } = req.body;
    name = (name || '').trim();

    if (!name)          return res.status(400).json({ error: 'Name cannot be empty.' });
    if (name.length > 30) return res.status(400).json({ error: 'Name must be 30 characters or fewer.' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profile = user.profiles.find(p => p.slot === parseInt(req.params.slot));
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    profile.name = name;
    await user.save();

    res.json({ ok: true, profiles: user.profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/profiles/:slot/pin — Set or change PIN ─────────────────
router.put('/:slot/pin', async (req, res) => {
  try {
    const { newPin, currentPin } = req.body;

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profile = user.profiles.find(p => p.slot === parseInt(req.params.slot));
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    // If PIN already exists, verify current first
    if (profile.pin && profile.pin !== currentPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect.' });
    }

    profile.pin    = newPin;
    profile.locked = true;
    await user.save();

    res.json({ ok: true, profiles: user.profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/profiles/:slot/pin — Remove PIN ──────────────────────
router.delete('/:slot/pin', async (req, res) => {
  try {
    const { currentPin } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profile = user.profiles.find(p => p.slot === parseInt(req.params.slot));
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    if (!profile.pin) {
      return res.status(400).json({ error: 'This profile has no PIN set.' });
    }
    if (profile.pin !== currentPin) {
      return res.status(401).json({ error: 'Incorrect PIN.' });
    }

    profile.pin    = null;
    profile.locked = false;
    await user.save();

    res.json({ ok: true, profiles: user.profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/profiles/:slot/verify-pin — Verify PIN ────────────────
router.post('/:slot/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profile = user.profiles.find(p => p.slot === parseInt(req.params.slot));
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    if (!profile.locked) return res.json({ ok: true }); // not locked
    if (profile.pin === pin) return res.json({ ok: true });

    res.status(401).json({ ok: false, error: 'Incorrect PIN. Please try again.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
