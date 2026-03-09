/**
 * navbar.js
 * SCASFLIX - Auth-aware navbar for index.html
 * Depends on: auth.js
 */

document.addEventListener('DOMContentLoaded', function () {
  // ─── Auth Guard: must be signed in AND have chosen a profile ─────────────
  if (!getCurrentUser()) {
    window.location.replace('login.html');
    return;
  }
  if (!getActiveProfile()) {
    window.location.replace('profile.html');
    return;
  }

  renderNavAuth();
  handleLoginRedirect();
});

function renderNavAuth() {
  var area = document.getElementById('navAuthArea');
  if (!area) return;

  var profile = getActiveProfile();
  var name    = profile ? esc(profile.name) : 'User';
  var color   = profile ? profile.color : '#e50914';
  var initial = name.charAt(0).toUpperCase();

  area.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;">' +
      '<a href="profile.html" title="Switch Profile" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#ccc;font-size:0.9rem;transition:color 0.2s;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'#ccc\'">' +
        '<div style="width:32px;height:32px;border-radius:4px;background:' + color + ';display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.95rem;color:#fff;">' + initial + '</div>' +
        name +
      '</a>' +
      '<button class="btn-signout" onclick="handleSignOut()">Sign Out</button>' +
    '</div>';
}

function handleLoginRedirect() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('welcome') === '1') {
    var profile = getActiveProfile();
    var name    = profile ? profile.name.split(' ')[0] : 'User';
    showToast('Welcome, ' + esc(name) + '! \uD83C\uDFAC', 'success');
    history.replaceState({}, '', 'index.html');
  }
}

function handleSignOut() {
  authSignOut();
  window.location.replace('login.html?tab=signin&msg_type=info&msg=You+have+been+signed+out.');
}
