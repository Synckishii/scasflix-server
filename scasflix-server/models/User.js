/**
 * models/User.js
 * SCASFLIX — User Schema
 */

const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  slot:   { type: Number, required: true },
  name:   { type: String, required: true, trim: true },
  color:  { type: String, default: '#e50914' },
  pin:    { type: String, default: null },
  locked: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  profiles:  { type: [profileSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
