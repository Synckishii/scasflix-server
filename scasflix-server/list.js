/**
 * routes/list.js
 * SCASFLIX — My List Routes (requires JWT)
 * FIXED: Each profile has its own isolated list
 */

const express = require('express');
const router  = express.Router();
const MyList  = require('../models/MyList');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

// All routes below require a valid JWT
router.use(auth);

// ── GET /api/list/:profileSlot — Get My List for this profile ────────
router.get('/:profileSlot', async (req, res) => {
  try {
    const profileSlot = parseInt(req.params.profileSlot);
    
    // Validate slot exists for this user
    const user = await User.findById(req.user.userId).select('profiles');
    if (!user || !user.profiles.find(p => p.slot === profileSlot)) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const doc = await MyList.findOne({
      userId:      req.user.userId,
      profileSlot: profileSlot
    });
    
    res.json(doc ? doc.items : []);
  } catch (err) {
    console.error('List GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/list/:profileSlot — Add item to this profile's list ────
router.post('/:profileSlot', async (req, res) => {
  try {
    const profileSlot = parseInt(req.params.profileSlot);
    const { tmdbId, mediaType, title, genre, posterUrl, score } = req.body;

    if (!tmdbId || !title) {
      return res.status(400).json({ error: 'tmdbId and title are required.' });
    }

    // Validate profile exists for this user
    const user = await User.findById(req.user.userId).select('profiles');
    if (!user || !user.profiles.find(p => p.slot === profileSlot)) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Get or create this profile's list
    let doc = await MyList.findOne({
      userId:      req.user.userId,
      profileSlot: profileSlot
    });

    if (!doc) {
      doc = await MyList.create({
        userId:      req.user.userId,
        profileSlot: profileSlot,
        items:       []
      });
    }

    // Prevent duplicates
    const alreadyIn = doc.items.some(i => i.tmdbId === parseInt(tmdbId));
    if (!alreadyIn) {
      doc.items.push({
        tmdbId: parseInt(tmdbId),
        mediaType: mediaType || 'movie',
        title,
        genre: genre || '',
        posterUrl: posterUrl || '',
        score: score || ''
      });
      await doc.save();
    }

    res.json({ ok: true, items: doc.items });
  } catch (err) {
    console.error('List POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/list/:profileSlot/:tmdbId — Remove item from list ────
router.delete('/:profileSlot/:tmdbId', async (req, res) => {
  try {
    const profileSlot = parseInt(req.params.profileSlot);
    const tmdbId = parseInt(req.params.tmdbId);

    // Validate profile exists
    const user = await User.findById(req.user.userId).select('profiles');
    if (!user || !user.profiles.find(p => p.slot === profileSlot)) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const doc = await MyList.findOne({
      userId:      req.user.userId,
      profileSlot: profileSlot
    });

    if (doc) {
      doc.items = doc.items.filter(i => i.tmdbId !== tmdbId);
      await doc.save();
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('List DELETE error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/list/:profileSlot — Clear entire list for this profile
router.delete('/:profileSlot', async (req, res) => {
  try {
    const profileSlot = parseInt(req.params.profileSlot);

    // Validate profile exists
    const user = await User.findById(req.user.userId).select('profiles');
    if (!user || !user.profiles.find(p => p.slot === profileSlot)) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    await MyList.findOneAndUpdate(
      { userId: req.user.userId, profileSlot: profileSlot },
      { $set: { items: [] } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('List clear error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
