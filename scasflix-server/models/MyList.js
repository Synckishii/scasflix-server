/**
 * models/MyList.js
 * SCASFLIX — My List Schema
 */

const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema({
  tmdbId:    { type: Number, required: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  title:     { type: String, required: true },
  genre:     { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  score:     { type: String, default: '' },
  addedAt:   { type: Date, default: Date.now }
}, { _id: false });

const myListSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileSlot: { type: Number, required: true },
  items:       { type: [listItemSchema], default: [] }
});

// Compound index: one list doc per user per profile slot
myListSchema.index({ userId: 1, profileSlot: 1 }, { unique: true });

module.exports = mongoose.model('MyList', myListSchema);
