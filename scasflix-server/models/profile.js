/**
 * profile.js
 * SCASFLIX — Profile selector page logic
 * Depends on: auth.js
 */

/* ── Guard ───────────────────────────────────────────────────────── */
if (!getCurrentUser()) window.location.replace('login.html');

/* ── State ───────────────────────────────────────────────────────── */
var selectedSlot = null;
var manageMode   = false;
var editingSlot  = null;   // slot currently open in manage modal

/* ═══════════════════════════════════════════════════════════════════
   GRID RENDERING
═══════════════════════════════════════════════════════════════════ */
function renderGrid() {
  var profiles = getProfiles();
  var grid     = document.getElementById('profilesGrid');
  grid.innerHTML = '';
  grid.classList.toggle('manage-mode', manageMode);

  profiles.forEach(function(p, i) {
    var initial = p.name.charAt(0).toUpperCase();
    var card    = document.createElement('div');
    card.className  = 'profile-card' + (selectedSlot === p.slot ? ' selected' : '');
    card.dataset.slot = p.slot;

    /* Lock icon shown when profile has a PIN */
    var lockBadge = p.locked
      ? '<div class="lock-badge" title="Profile Lock enabled">'
        + '<svg viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>'
        + '</div>'
      : '';

    card.innerHTML =
      '<div class="profile-avatar" style="background:' + p.color + ';">'
        + lockBadge
        + initial
        + '<button class="edit-btn" title="Manage profile" onclick="openManageModal(event,' + p.slot + ')">'
            + '<svg viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>'
          + '</button>'
      + '</div>'
      + '<div class="profile-name">' + esc(p.name) + '</div>';

    /* Staggered entrance animation */
    card.style.animation      = 'cardPop 0.5s cubic-bezier(0.22,1,0.36,1) both';
    card.style.animationDelay = (0.18 + i * 0.08) + 's';

    card.addEventListener('click', function(e) {
      if (e.target.closest('.edit-btn')) return;
      onCardClick(p.slot);
    });

    grid.appendChild(card);
  });
}

/* ── Card click: locked → go to PIN page, else select ── */
function onCardClick(slot) {
  var p = getProfileBySlot(slot);
  if (!p) return;

  if (p.locked) {
    /* Store which slot we want then redirect to PIN entry */
    sessionStorage.setItem('scasflix_pending_slot', slot);
    window.location.href = 'pin.html';
    return;
  }
  selectProfile(slot);
}

function selectProfile(slot) {
  selectedSlot = slot;
  document.querySelectorAll('.profile-card').forEach(function(c) {
    c.classList.toggle('selected', parseInt(c.dataset.slot) === slot);
  });
  document.getElementById('btnEnter').classList.add('visible');
}

/* ── Enter the app ── */
function enterWithProfile() {
  if (!selectedSlot) return;
  var p = getProfileBySlot(selectedSlot);
  if (!p) return;
  setActiveProfile(p);
  window.location.replace('index.html?welcome=1');
}

/* ── Manage mode toggle ── */
function toggleManageMode() {
  manageMode = !manageMode;
  document.getElementById('btnManage').textContent = manageMode ? 'Done' : 'Manage Profiles';
  document.getElementById('manageHint').classList.toggle('visible', manageMode);
  renderGrid();
}

/* ═══════════════════════════════════════════════════════════════════
   MANAGE MODAL  (rename + lock tabs)
═══════════════════════════════════════════════════════════════════ */
function openManageModal(e, slot) {
  e.stopPropagation();
  editingSlot = slot;

  var p = getProfileBySlot(slot);
  if (!p) return;

  /* Avatar preview */
  var av = document.getElementById('manageModalAvatar');
  av.style.background = p.color;
  av.textContent = p.name.charAt(0).toUpperCase();

  /* Rename tab */
  document.getElementById('renameInput').value = p.name;
  document.getElementById('charCount').textContent = p.name.length;
  document.getElementById('renameError').textContent = '';

  /* Lock tab */
  renderLockTab(p);

  /* Reset to rename tab */
  switchManageTab('rename');

  document.getElementById('manageModal').classList.add('open');
  setTimeout(function(){ document.getElementById('renameInput').focus(); document.getElementById('renameInput').select(); }, 120);
}

function closeManageModal() {
  document.getElementById('manageModal').classList.remove('open');
  editingSlot = null;
  clearPinInput('setPinBoxes');
  clearPinInput('removePinBoxes');
  clearPinInput('newPinBoxes');
  clearPinInput('confirmPinBoxes');
}

function switchManageTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.modal-panel').forEach(function(p) {
    p.classList.toggle('active', p.dataset.panel === tab);
  });
}

/* ─ Render the lock tab based on profile state ─ */
function renderLockTab(p) {
  var container = document.getElementById('lockTabContent');

  if (!p.locked) {
    /* No PIN — show set PIN UI */
    container.innerHTML =
      '<div class="lock-section-title">Profile Lock</div>'
      + '<p style="color:#888;font-size:0.87rem;margin-bottom:18px;line-height:1.6;">Add a 4-digit PIN to prevent others from accessing this profile without the code.</p>'
      + '<label style="display:block;font-size:0.82rem;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Set PIN</label>'
      + buildPinBoxesHTML('setPinBoxes')
      + '<label style="display:block;font-size:0.82rem;color:#888;margin:14px 0 8px;text-transform:uppercase;letter-spacing:1px;">Confirm PIN</label>'
      + buildPinBoxesHTML('confirmPinBoxes')
      + '<div class="modal-error" id="lockError"></div>'
      + '<button class="btn-modal-primary" onclick="handleSetPin()" style="width:100%;margin-top:4px;">Enable Profile Lock</button>';
    initPinBoxes('setPinBoxes');
    initPinBoxes('confirmPinBoxes');

  } else {
    /* Has PIN — show change / remove UI */
    container.innerHTML =
      '<div class="lock-section-title">Profile Lock</div>'
      + '<div class="lock-status">'
        + '<span class="lock-status-label lock-on">'
          + '<svg viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>'
          + 'Profile Lock is ON'
        + '</span>'
      + '</div>'
      + '<p style="color:#888;font-size:0.85rem;margin-bottom:18px;line-height:1.6;">Enter your current PIN to change or remove the lock.</p>'
      + '<label style="display:block;font-size:0.82rem;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Current PIN</label>'
      + buildPinBoxesHTML('currentPinBoxes')
      + '<div style="display:flex;gap:10px;margin-top:16px;">'
        + '<button class="btn-modal-secondary" onclick="handleChangePin()" style="flex:1;">Change PIN</button>'
        + '<button class="btn-modal-danger"    onclick="handleRemovePin()" style="flex:1;">Remove Lock</button>'
      + '</div>'
      + '<div class="modal-error" id="lockError"></div>';
    initPinBoxes('currentPinBoxes');
  }
}

/* ─ Set PIN ─ */
function handleSetPin() {
  var pin1 = getPinValue('setPinBoxes');
  var pin2 = getPinValue('confirmPinBoxes');
  var err  = document.getElementById('lockError');

  if (pin1.length < 4) { err.textContent='Please enter a full 4-digit PIN.'; shakePinBoxes('setPinBoxes'); return; }
  if (pin2.length < 4) { err.textContent='Please confirm your PIN.'; shakePinBoxes('confirmPinBoxes'); return; }
  if (pin1 !== pin2)   { err.textContent='PINs do not match. Try again.'; shakePinBoxes('confirmPinBoxes'); clearPinInput('confirmPinBoxes'); return; }

  var result = setProfilePin(editingSlot, pin1, null);
  if (!result.ok) { err.textContent = result.error; return; }

  closeManageModal();
  renderGrid();
  showToast('Profile Lock enabled! 🔒', 'success');
}

/* ─ Change PIN (requires current) ─ */
function handleChangePin() {
  var currentPin = getPinValue('currentPinBoxes');
  var p = getProfileBySlot(editingSlot);
  var err = document.getElementById('lockError');

  if (currentPin.length < 4) { err.textContent='Enter your current 4-digit PIN first.'; shakePinBoxes('currentPinBoxes'); return; }

  /* Verify current PIN */
  var check = verifyProfilePin(editingSlot, currentPin);
  if (!check.ok) { err.textContent = check.error; shakePinBoxes('currentPinBoxes'); clearPinInput('currentPinBoxes'); return; }

  /* Show new PIN form inside lock tab */
  var container = document.getElementById('lockTabContent');
  container.innerHTML =
    '<div class="lock-section-title">Change PIN</div>'
    + '<label style="display:block;font-size:0.82rem;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">New PIN</label>'
    + buildPinBoxesHTML('newPinBoxes')
    + '<label style="display:block;font-size:0.82rem;color:#888;margin:14px 0 8px;text-transform:uppercase;letter-spacing:1px;">Confirm New PIN</label>'
    + buildPinBoxesHTML('confirmNewPinBoxes')
    + '<div class="modal-error" id="lockError"></div>'
    + '<div style="display:flex;gap:10px;margin-top:6px;">'
      + '<button class="btn-modal-primary"   onclick="handleSaveNewPin(\'' + currentPin + '\')" style="flex:1;">Save New PIN</button>'
      + '<button class="btn-modal-secondary" onclick="renderLockTab(getProfileBySlot(editingSlot))" style="flex:1;">Cancel</button>'
    + '</div>';
  initPinBoxes('newPinBoxes');
  initPinBoxes('confirmNewPinBoxes');
}

function handleSaveNewPin(currentPin) {
  var newPin  = getPinValue('newPinBoxes');
  var confirm = getPinValue('confirmNewPinBoxes');
  var err     = document.getElementById('lockError');

  if (newPin.length < 4)  { err.textContent='Enter a full 4-digit new PIN.'; shakePinBoxes('newPinBoxes'); return; }
  if (confirm.length < 4) { err.textContent='Please confirm your new PIN.'; shakePinBoxes('confirmNewPinBoxes'); return; }
  if (newPin !== confirm)  { err.textContent='PINs do not match.'; shakePinBoxes('confirmNewPinBoxes'); clearPinInput('confirmNewPinBoxes'); return; }

  var result = setProfilePin(editingSlot, newPin, currentPin);
  if (!result.ok) { err.textContent = result.error; return; }

  closeManageModal();
  renderGrid();
  showToast('PIN changed successfully! 🔒', 'success');
}

/* ─ Remove PIN ─ */
function handleRemovePin() {
  var currentPin = getPinValue('currentPinBoxes');
  var err        = document.getElementById('lockError');

  if (currentPin.length < 4) { err.textContent='Enter your current PIN to remove the lock.'; shakePinBoxes('currentPinBoxes'); return; }

  var result = removeProfilePin(editingSlot, currentPin);
  if (!result.ok) { err.textContent=result.error; shakePinBoxes('currentPinBoxes'); clearPinInput('currentPinBoxes'); return; }

  closeManageModal();
  renderGrid();
  showToast('Profile Lock removed.', 'info');
}

/* ─ Rename ─ */
function saveRename() {
  if (editingSlot === null) return;
  var newName = document.getElementById('renameInput').value;
  var result  = renameProfile(editingSlot, newName);
  if (!result.ok) { document.getElementById('renameError').textContent = result.error; return; }
  closeManageModal();
  renderGrid();
  if (selectedSlot === editingSlot) selectProfile(editingSlot);
}

function updateCharCount() {
  document.getElementById('charCount').textContent = document.getElementById('renameInput').value.length;
}

/* ═══════════════════════════════════════════════════════════════════
   PIN BOX WIDGET HELPERS
═══════════════════════════════════════════════════════════════════ */

function buildPinBoxesHTML(id) {
  return '<div class="pin-dots" id="' + id + '">'
    + '<div class="pin-box" data-idx="0"></div>'
    + '<div class="pin-box" data-idx="1"></div>'
    + '<div class="pin-box" data-idx="2"></div>'
    + '<div class="pin-box" data-idx="3"></div>'
    + '<input class="pin-real-input" type="tel" maxlength="4" pattern="[0-9]*" inputmode="numeric" autocomplete="off">'
    + '</div>';
}

function initPinBoxes(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var boxes = container.querySelectorAll('.pin-box');
  var input = container.querySelector('.pin-real-input');

  function refresh() {
    var val = input.value.replace(/\D/g,'').slice(0,4);
    input.value = val;
    boxes.forEach(function(box, i) {
      box.classList.remove('filled','error');
      box.classList.toggle('filled', i < val.length);
      box.classList.toggle('focused', i === val.length && document.activeElement === input);
    });
  }

  input.addEventListener('focus',  refresh);
  input.addEventListener('blur',   refresh);
  input.addEventListener('input',  function() {
    input.value = input.value.replace(/\D/g,'').slice(0,4);
    refresh();
  });
  input.addEventListener('keydown', function(e) {
    if (e.key==='Enter') {
      /* Try to auto-advance to the next pin group or trigger save */
      var allGroups = document.querySelectorAll('.pin-dots');
      var idx = Array.from(allGroups).indexOf(container);
      if (idx >= 0 && idx < allGroups.length-1) {
        allGroups[idx+1].querySelector('.pin-real-input').focus();
      }
    }
  });

  /* Click any box → focus the hidden input */
  boxes.forEach(function(box) {
    box.addEventListener('click', function() { input.focus(); });
  });
}

function getPinValue(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return '';
  var input = container.querySelector('.pin-real-input');
  return input ? input.value.replace(/\D/g,'') : '';
}

function clearPinInput(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var input = container.querySelector('.pin-real-input');
  if (input) { input.value=''; }
  container.querySelectorAll('.pin-box').forEach(function(b){
    b.classList.remove('filled','focused','error');
  });
}

function shakePinBoxes(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.pin-box').forEach(function(b){
    b.classList.remove('error');
    void b.offsetWidth;
    b.classList.add('error');
  });
}

/* ── Close modal on overlay click ── */
document.getElementById('manageModal').addEventListener('click', function(e) {
  if (e.target === this) closeManageModal();
});

/* ── Boot ── */
renderGrid();

/* ── Handle return from PIN page (unlocked successfully) ── */
(function(){
  var params = new URLSearchParams(window.location.search);
  if (params.get('unlocked') === '1') {
    var slot = parseInt(sessionStorage.getItem('scasflix_pending_slot'));
    sessionStorage.removeItem('scasflix_pending_slot');
    if (slot) selectProfile(slot);
    history.replaceState({}, '', 'profile.html');
  }
})();
