/**
 * routes/list.js
 * SCASFLIX — My List Routes (requires JWT)
 */

const express = require('express');
const router  = express.Router();
const MyList  = require('../models/MyList');
const auth    = require('../middleware/authMiddleware');

// All routes below require a valid JWT
router.use(auth);

// ── GET /api/list/:profileSlot ───────────────────────────────────────
router.get('/:profileSlot', async (req, res) => {
  try {
    const doc = await MyList.findOne({
      userId:      req.user.userId,
      profileSlot: parseInt(req.params.profileSlot)
    });
    res.json(doc ? doc.items : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/list/:profileSlot — Add item ───────────────────────────
router.post('/:profileSlot', async (req, res) => {
  try {
    const { tmdbId, mediaType, title, genre, posterUrl, score } = req.body;

    if (!tmdbId || !title) {
      return res.status(400).json({ error: 'tmdbId and title are required.' });
    }

    let doc = await MyList.findOne({
      userId:      req.user.userId,
      profileSlot: parseInt(req.params.profileSlot)
    });

    if (!doc) {
      doc = await MyList.create({
        userId:      req.user.userId,
        profileSlot: parseInt(req.params.profileSlot),
        items:       []
      });
    }

    // Prevent duplicates
    const alreadyIn = doc.items.some(i => i.tmdbId === tmdbId);
    if (!alreadyIn) {
      doc.items.push({ tmdbId, mediaType, title, genre, posterUrl, score });
      await doc.save();
    }

    res.json({ ok: true, items: doc.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/list/:profileSlot/:tmdbId — Remove item ─────────────
router.delete('/:profileSlot/:tmdbId', async (req, res) => {
  try {
    const doc = await MyList.findOne({
      userId:      req.user.userId,
      profileSlot: parseInt(req.params.profileSlot)
    });

    if (doc) {
      doc.items = doc.items.filter(
        i => i.tmdbId !== parseInt(req.params.tmdbId)
      );
      await doc.save();
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/list/:profileSlot — Clear entire list ───────────────
router.delete('/:profileSlot', async (req, res) => {
  try {
    await MyList.findOneAndUpdate(
      { userId: req.user.userId, profileSlot: parseInt(req.params.profileSlot) },
      { $set: { items: [] } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
