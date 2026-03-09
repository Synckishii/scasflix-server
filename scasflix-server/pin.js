/**
 * pin.js
 * SCASFLIX — PIN entry page logic
 * Depends on: auth.js
 */

/* ── Guard: must have an account and a pending slot ── */
if (!getCurrentUser()) window.location.replace('login.html');

var PENDING_KEY    = 'scasflix_pending_slot';
var ATTEMPT_KEY    = 'scasflix_pin_attempts';   // { slot, count, lockedUntil }
var MAX_ATTEMPTS   = 5;
var LOCKOUT_MS     = 30000; // 30 seconds

var targetSlot  = parseInt(sessionStorage.getItem(PENDING_KEY)) || null;
var profile     = targetSlot ? getProfileBySlot(targetSlot) : null;
var pinValue    = '';

/* ── If no pending slot or profile, back to selector ── */
if (!targetSlot || !profile || !profile.locked) {
  window.location.replace('profile.html');
}

/* ── Render static profile info ── */
document.addEventListener('DOMContentLoaded', function() {
  var av = document.getElementById('pinAvatar');
  av.style.background = profile.color;
  av.textContent      = profile.name.charAt(0).toUpperCase();
  document.getElementById('pinProfileName').textContent = profile.name;

  checkLockout();
  initPinWidget();
});

/* ── Attempt tracking ── */
function getAttemptData() {
  var raw = sessionStorage.getItem(ATTEMPT_KEY);
  if (!raw) return { slot: targetSlot, count: 0, lockedUntil: 0 };
  var d = JSON.parse(raw);
  if (d.slot !== targetSlot) return { slot: targetSlot, count: 0, lockedUntil: 0 };
  return d;
}
function saveAttemptData(d) { sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(d)); }
function resetAttempts()    { sessionStorage.removeItem(ATTEMPT_KEY); }

function checkLockout() {
  var d = getAttemptData();
  if (d.lockedUntil && Date.now() < d.lockedUntil) {
    showLockedState(d.lockedUntil);
    return true;
  }
  return false;
}

function showLockedState(until) {
  document.getElementById('pinWidget').style.display = 'none';
  var locked = document.getElementById('pinLockedMsg');
  locked.style.display = 'block';

  var interval = setInterval(function() {
    var remaining = Math.ceil((until - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(interval);
      resetAttempts();
      locked.style.display = 'none';
      document.getElementById('pinWidget').style.display = 'block';
      pinValue = '';
      refreshBoxes();
    } else {
      document.getElementById('lockCountdown').textContent = remaining;
    }
  }, 500);

  // Initial countdown
  document.getElementById('lockCountdown').textContent = Math.ceil((until - Date.now()) / 1000);
}

/* ── PIN widget ── */
function initPinWidget() {
  var input = document.getElementById('pinRealInput');
  var boxes = document.querySelectorAll('#pinBoxes .pin-box');

  input.addEventListener('input', function() {
    pinValue = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = pinValue;
    refreshBoxes();
    if (pinValue.length === 4) {
      setTimeout(submitPin, 120); // slight delay so last dot renders
    }
  });

  input.addEventListener('focus',  refreshBoxes);
  input.addEventListener('blur',   refreshBoxes);

  // Click any box → focus input
  boxes.forEach(function(box) {
    box.addEventListener('click', function() { input.focus(); });
  });

  // Auto-focus
  setTimeout(function() { input.focus(); }, 300);
}

function refreshBoxes() {
  var input  = document.getElementById('pinRealInput');
  var boxes  = document.querySelectorAll('#pinBoxes .pin-box');
  var active = document.activeElement === input;

  boxes.forEach(function(box, i) {
    box.classList.remove('filled', 'focused', 'error');
    if (i < pinValue.length) box.classList.add('filled');
    if (i === pinValue.length && active) box.classList.add('focused');
  });
}

function submitPin() {
  if (checkLockout()) return;

  var result = verifyProfilePin(targetSlot, pinValue);

  if (result.ok) {
    /* ✅ Correct — clear attempts, set profile, go to selector (which will select the slot) */
    resetAttempts();
    sessionStorage.removeItem(PENDING_KEY);
    setActiveProfile(profile);
    window.location.replace('index.html?welcome=1');
    return;
  }

  /* ❌ Wrong PIN */
  var d = getAttemptData();
  d.count++;
  var remaining = MAX_ATTEMPTS - d.count;

  if (d.count >= MAX_ATTEMPTS) {
    d.lockedUntil = Date.now() + LOCKOUT_MS;
    saveAttemptData(d);
    shakePinBoxes();
    showLockedState(d.lockedUntil);
    return;
  }

  saveAttemptData(d);

  /* Show error + remaining attempts */
  document.getElementById('pinError').textContent = 'Incorrect PIN. ' + remaining + ' attempt' + (remaining===1?'':'s') + ' remaining.';
  document.getElementById('pinAttempts').textContent = '';

  /* Shake and clear */
  shakePinBoxes();
  setTimeout(function() {
    pinValue = '';
    document.getElementById('pinRealInput').value = '';
    refreshBoxes();
    document.getElementById('pinRealInput').focus();
  }, 500);
}

function shakePinBoxes() {
  var boxes = document.querySelectorAll('#pinBoxes .pin-box');
  boxes.forEach(function(box) {
    box.classList.remove('error');
    void box.offsetWidth;
    box.classList.add('error');
  });
}

function goBack() {
  sessionStorage.removeItem(PENDING_KEY);
  window.location.replace('profile.html');
}
