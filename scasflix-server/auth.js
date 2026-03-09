/**
 * auth.js
 * SCASFLIX — Frontend Auth & Profile State (MongoDB + JWT version)
 * Loaded by: login.html, profile.html, pin.html, index.html
 */

// ── API Base URL — change this to your deployed server URL in production ──
var API_BASE = 'http://localhost:5000/api';

// ── Storage Keys ──────────────────────────────────────────────────────
var SESSION_KEY  = 'scasflix_session';   // signed-in user object
var TOKEN_KEY    = 'scasflix_token';     // JWT token
var PROFILE_KEY  = 'scasflix_profile';  // active profile for this session

// ═══════════════════════════════════════════════════════════════════
//  TOKEN & SESSION
// ═══════════════════════════════════════════════════════════════════

function getToken()       { return sessionStorage.getItem(TOKEN_KEY) || null; }
function setToken(t)      { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); }

function getCurrentUser() {
  var r = sessionStorage.getItem(SESSION_KEY);
  return r ? JSON.parse(r) : null;
}
function setCurrentUser(u) {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else   sessionStorage.removeItem(SESSION_KEY);
}

// ── Authenticated fetch helper ────────────────────────────────────
async function apiFetch(path, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers['Content-Type']  = 'application/json';
  var token = getToken();
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  var res  = await fetch(API_BASE + path, options);
  var data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ═══════════════════════════════════════════════════════════════════
//  PROFILE HELPERS  (pulled from session user object)
// ═══════════════════════════════════════════════════════════════════

function getProfiles() {
  var user = getCurrentUser();
  if (!user || !user.profiles) return [];
  return user.profiles;
}

function getProfileBySlot(slot) {
  return getProfiles().find(function(p) { return p.slot === slot; }) || null;
}

function getActiveProfile()   {
  var r = sessionStorage.getItem(PROFILE_KEY);
  return r ? JSON.parse(r) : null;
}
function setActiveProfile(p)  {
  if (p) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  else   sessionStorage.removeItem(PROFILE_KEY);
}
function clearActiveProfile() { sessionStorage.removeItem(PROFILE_KEY); }

// Sync updated profiles array back into the session user object
function _syncProfiles(profiles) {
  var user = getCurrentUser();
  if (user) {
    user.profiles = profiles;
    setCurrentUser(user);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  AUTH ACTIONS
// ═══════════════════════════════════════════════════════════════════

async function authSignIn(email, password) {
  email = (email || '').trim();
  if (!email || !password) return { ok: false, error: 'Email and password are required.' };

  var result = await apiFetch('/auth/signin', {
    method: 'POST',
    body:   JSON.stringify({ email, password })
  });

  if (!result.ok) return { ok: false, error: result.data.error || 'Sign in failed.' };

  setToken(result.data.token);
  setCurrentUser(result.data.user);
  clearActiveProfile();
  return { ok: true, user: result.data.user };
}

async function authSignUp(name, email, password, confirm, agreed) {
  name  = (name  || '').trim();
  email = (email || '').trim();

  var result = await apiFetch('/auth/signup', {
    method: 'POST',
    body:   JSON.stringify({ name, email, password, confirm, agreed })
  });

  if (!result.ok) return { ok: false, error: result.data.error || 'Sign up failed.' };
  return { ok: true, name: result.data.name };
}

function authSignOut() {
  setToken(null);
  setCurrentUser(null);
  clearActiveProfile();
}

// ═══════════════════════════════════════════════════════════════════
//  PROFILE MANAGEMENT  (calls backend, syncs session)
// ═══════════════════════════════════════════════════════════════════

async function renameProfile(slot, newName) {
  newName = (newName || '').trim();
  if (!newName)            return { ok: false, error: 'Name cannot be empty.' };
  if (newName.length > 30) return { ok: false, error: 'Name must be 30 characters or fewer.' };

  var result = await apiFetch('/profiles/' + slot + '/rename', {
    method: 'PUT',
    body:   JSON.stringify({ name: newName })
  });

  if (!result.ok) return { ok: false, error: result.data.error };
  _syncProfiles(result.data.profiles);

  // Keep active profile in sync
  var active = getActiveProfile();
  if (active && active.slot === slot) {
    active.name = newName;
    setActiveProfile(active);
  }
  return { ok: true };
}

async function setProfilePin(slot, newPin, currentPin) {
  if (!/^\d{4}$/.test(newPin)) return { ok: false, error: 'PIN must be exactly 4 digits.' };

  var result = await apiFetch('/profiles/' + slot + '/pin', {
    method: 'PUT',
    body:   JSON.stringify({ newPin, currentPin: currentPin || null })
  });

  if (!result.ok) return { ok: false, error: result.data.error };
  _syncProfiles(result.data.profiles);
  return { ok: true };
}

async function removeProfilePin(slot, currentPin) {
  var result = await apiFetch('/profiles/' + slot + '/pin', {
    method: 'DELETE',
    body:   JSON.stringify({ currentPin })
  });

  if (!result.ok) return { ok: false, error: result.data.error };
  _syncProfiles(result.data.profiles);
  return { ok: true };
}

async function verifyProfilePin(slot, attempt) {
  var result = await apiFetch('/profiles/' + slot + '/verify-pin', {
    method: 'POST',
    body:   JSON.stringify({ pin: attempt })
  });

  if (result.ok) return { ok: true };
  return { ok: false, error: result.data.error || 'Incorrect PIN.' };
}

// ═══════════════════════════════════════════════════════════════════
//  MY LIST  (calls backend, per-user per-profile)
// ═══════════════════════════════════════════════════════════════════

var _listCache = null; // simple in-memory cache for current session

async function getMyList() {
  var profile = getActiveProfile();
  if (!profile) return [];
  var result = await apiFetch('/list/' + profile.slot);
  if (!result.ok) return [];
  _listCache = result.data;
  return result.data;
}

async function addToList(tmdbId, mediaType, title, genre, posterUrl, score) {
  var profile = getActiveProfile();
  if (!profile) return;
  await apiFetch('/list/' + profile.slot, {
    method: 'POST',
    body:   JSON.stringify({ tmdbId, mediaType, title, genre, posterUrl, score })
  });
}

async function removeFromList(tmdbId) {
  var profile = getActiveProfile();
  if (!profile) return;
  await apiFetch('/list/' + profile.slot + '/' + tmdbId, { method: 'DELETE' });
}

async function isInList(tmdbId) {
  var list = _listCache || await getMyList();
  return list.some(function(i) { return i.tmdbId === tmdbId; });
}

// ═══════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function getPasswordStrength(pw) {
  var score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  var lvls = [
    { pct: '0%',   color: '#555',    text: '' },
    { pct: '25%',  color: '#e50914', text: 'Weak' },
    { pct: '50%',  color: '#f39c12', text: 'Fair' },
    { pct: '75%',  color: '#27ae60', text: 'Good' },
    { pct: '100%', color: '#1abc9c', text: 'Strong' },
  ];
  return pw.length === 0 ? lvls[0] : lvls[score];
}

function validateContact(name, email, subject, message) {
  name = (name || '').trim(); email = (email || '').trim(); message = (message || '').trim();
  if (!name || !email || !subject || !message) return { ok: false, error: 'All fields are required.' };
  if (!validateEmail(email))                   return { ok: false, error: 'Invalid email format.' };
  if (name.length < 2)                         return { ok: false, error: 'Please enter a valid name.' };
  if (message.length < 10)                     return { ok: false, error: 'Message must be at least 10 characters.' };
  return { ok: true };
}

var _toastTimer;
function showToast(msg, type) {
  type = type || 'success';
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'toast-alert ' + type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { el.className = 'toast-alert hidden'; }, 4500);
}
