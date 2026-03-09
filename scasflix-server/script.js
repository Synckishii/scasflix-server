/**
 * script.js
 * SCASFLIX — Main Frontend Logic (TMDB + MongoDB version)
 */

var API_BASE = 'https://scasflix-server.onrender.com/api';
var IMG_BASE = 'https://image.tmdb.org/t/p/w300';

// ═══════════════════════════════════════════════════════════════════
//  TMDB SECTION LOADER
// ═══════════════════════════════════════════════════════════════════

async function loadTMDBSection(endpoint, gridId) {
  var grid = document.getElementById(gridId);
  if (!grid) return;

  // Show skeleton loading
  grid.innerHTML = Array(4).fill(
    '<div class="movie-card" style="background:#1c1c1c;min-height:280px;border-radius:8px;animation:pulse 1.5s infinite;">' +
    '<div style="width:100%;height:100%;background:linear-gradient(90deg,#1c1c1c 25%,#2a2a2a 50%,#1c1c1c 75%);background-size:200%;animation:shimmer 1.5s infinite;"></div>' +
    '</div>'
  ).join('');

  try {
    var res   = await fetch(API_BASE + '/tmdb/' + endpoint);
    var items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<p style="color:#555;padding:20px;">No content available.</p>';
      return;
    }

    grid.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
      var item  = items[i];
      var inList = typeof isInList === 'function' ? await isInList(item.tmdbId) : false;
      grid.appendChild(buildMovieCard(item, inList));
    }

  } catch (err) {
    console.error('TMDB load error:', err);
    grid.innerHTML = '<p style="color:#555;padding:20px;">Could not load content. Is the server running?</p>';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  HERO CAROUSEL — Load from TMDB
// ═══════════════════════════════════════════════════════════════════

async function loadHeroSlides() {
  try {
    var res   = await fetch(API_BASE + '/tmdb/hero');
    var items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return;

    var heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    // Remove existing static slides
    heroSection.querySelectorAll('.hero-slide').forEach(function(s) { s.remove(); });
    heroSection.querySelectorAll('.hero-dots').forEach(function(d) { d.remove(); });

    // Build slides
    items.forEach(function(item, idx) {
      var slide = document.createElement('div');
      slide.className = 'hero-slide';
      slide.id        = 'hs' + (idx + 1);
      slide.style.backgroundImage = [
        'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        'linear-gradient(to top, rgba(20,20,20,1) 0%, transparent 30%, rgba(0,0,0,0.3) 100%)',
        'url("' + item.backdropUrl + '")'
      ].join(', ');
      slide.style.backgroundSize     = 'cover';
      slide.style.backgroundPosition = 'center';

      slide.innerHTML =
        '<div class="container">' +
          '<div class="col-content">' +
            '<h1>' + esc(item.title) + '</h1>' +
            '<div class="hero-badges">' +
              '<span class="badge-match">' + esc(item.score) + '</span>' +
              '<span class="badge-meta">'  + esc(item.year)  + '</span>' +
              '<span class="badge-meta">'  + esc(item.genre) + '</span>' +
              '<span class="badge-qual">HD</span>' +
            '</div>' +
            '<p class="lead">' + esc(item.overview) + '</p>' +
            '<div class="hero-btns">' +
              '<button class="btn-play" onclick="handleHeroPlay(\'' + esc(item.title) + '\')">' +
                '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>' +
                ' Play' +
              '</button>' +
              '<button class="btn-info" onclick="handleHeroInfo(' + item.id + ',\'' + item.mediaType + '\')">' +
                '<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>' +
                ' More Info' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      // Insert before the arrow buttons
      var prevBtn = heroSection.querySelector('.hero-prev');
      heroSection.insertBefore(slide, prevBtn || null);
    });

    // Build dots
    var dotsDiv = document.createElement('div');
    dotsDiv.className = 'hero-dots';
    items.forEach(function(_, idx) {
      var dot    = document.createElement('button');
      dot.className = 'hero-dot';
      dot.setAttribute('onclick', 'carouselGoSlide(' + idx + ')');
      dotsDiv.appendChild(dot);
    });
    heroSection.appendChild(dotsDiv);

    // Re-init carousel
    if (typeof initCarousel === 'function') initCarousel(items.length);

  } catch (err) {
    console.warn('Hero slide TMDB load failed, keeping static slides:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CARD BUILDER
// ═══════════════════════════════════════════════════════════════════

function buildMovieCard(item, inList) {
  var card = document.createElement('div');
  card.className = 'movie-card';

  var btnStyle = inList
    ? 'background:#2ecc71;border-color:#2ecc71;color:#fff;'
    : 'background:transparent;border:1px solid rgba(255,255,255,0.6);color:#fff;';
  var btnText = inList ? '✓ In My List' : '+ Add to List';

  card.innerHTML =
    '<img src="' + esc(item.posterUrl) + '" alt="' + esc(item.title) + '" loading="lazy">' +
    '<div class="movie-card-body">' +
      '<h6>' + esc(item.title) + '</h6>' +
      '<p>'  + esc(item.genre) + '</p>' +
      '<span class="badge-sm">' + esc(item.score) + '</span>' +
      '<button class="add-list-btn" ' +
        'style="margin-top:8px;padding:5px 12px;' + btnStyle + 'border-radius:4px;font-size:0.78rem;cursor:pointer;transition:all 0.2s;display:block;width:100%;" ' +
        'data-tmdbid="'  + item.tmdbId    + '" ' +
        'data-type="'    + esc(item.mediaType) + '" ' +
        'data-title="'   + esc(item.title)     + '" ' +
        'data-genre="'   + esc(item.genre)     + '" ' +
        'data-poster="'  + esc(item.posterUrl) + '" ' +
        'data-score="'   + esc(item.score)     + '">' +
        btnText +
      '</button>' +
    '</div>';

  // Wire the add/remove button
  var btn = card.querySelector('.add-list-btn');
  btn.addEventListener('click', function() { toggleListBtn(btn); });

  return card;
}

// ═══════════════════════════════════════════════════════════════════
//  MY LIST TOGGLE
// ═══════════════════════════════════════════════════════════════════

async function toggleListBtn(btn) {
  var tmdbId    = parseInt(btn.getAttribute('data-tmdbid'));
  var mediaType = btn.getAttribute('data-type');
  var title     = btn.getAttribute('data-title');
  var genre     = btn.getAttribute('data-genre');
  var posterUrl = btn.getAttribute('data-poster');
  var score     = btn.getAttribute('data-score');

  var alreadyIn = await isInList(tmdbId);

  if (alreadyIn) {
    await removeFromList(tmdbId);
    btn.textContent       = '+ Add to List';
    btn.style.background  = 'transparent';
    btn.style.borderColor = 'rgba(255,255,255,0.6)';
    btn.style.color       = '#fff';
    showToast('"' + title + '" removed from My List.', 'info');
  } else {
    await addToList(tmdbId, mediaType, title, genre, posterUrl, score);
    btn.textContent       = '✓ In My List';
    btn.style.background  = '#2ecc71';
    btn.style.borderColor = '#2ecc71';
    btn.style.color       = '#fff';
    showToast('"' + title + '" added to My List!', 'success');
  }
}

// ── Re-wire static add-list buttons (for any remaining static HTML cards) ──
function initListButtons() {
  var btns = document.querySelectorAll('.add-list-btn[data-title]');
  btns.forEach(function(btn) {
    if (btn._wired) return;
    btn._wired = true;
    btn.addEventListener('click', function() { toggleListBtn(btn); });
  });
}

// ═══════════════════════════════════════════════════════════════════
//  HERO PLAY / INFO HANDLERS
// ═══════════════════════════════════════════════════════════════════

function handleHeroPlay(title) {
  alert('▶ Now Playing: ' + title + '\nEnjoy the show on SCASFLIX!');
}

async function handleHeroInfo(id, type) {
  try {
    var res  = await fetch(API_BASE + '/tmdb/detail/' + type + '/' + id);
    var data = await res.json();
    var title   = data.title || data.name;
    var year    = (data.release_date || data.first_air_date || '').slice(0, 4);
    var rating  = data.vote_average ? data.vote_average.toFixed(1) + '/10' : 'N/A';
    var seasons = data.number_of_seasons ? data.number_of_seasons + ' Season(s)' : '';
    var genres  = (data.genres || []).map(function(g){ return g.name; }).join(', ');
    alert(
      'ℹ️ ' + title + '\n\n' +
      '📅 Year: '    + year    + '\n' +
      '⭐ Rating: '  + rating  + '\n' +
      (seasons ? '📺 Seasons: ' + seasons + '\n' : '') +
      '🎬 Genre: '   + genres  + '\n\n' +
      data.overview
    );
  } catch (err) {
    alert('Could not load info. Please try again.');
  }
}

// ═══════════════════════════════════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════════════════════════════════

var searchInput = document.getElementById('navSearchInput');
var searchBtn   = document.getElementById('navSearchBtn');

async function runSearch() {
  var query = searchInput ? searchInput.value.trim() : '';
  if (!query) {
    showToast('Please enter a movie or show title to search.', 'error');
    return;
  }

  showToast('Searching for "' + query + '"...', 'info');

  try {
    var res   = await fetch(API_BASE + '/tmdb/search?q=' + encodeURIComponent(query));
    var items = await res.json();

    if (!items.length) {
      showToast('No results found for "' + query + '".', 'error');
      return;
    }

    // Build a simple search results modal
    showSearchResults(query, items);
    if (searchInput) searchInput.value = '';

  } catch (err) {
    showToast('Search failed. Is the server running?', 'error');
  }
}

function showSearchResults(query, items) {
  // Remove existing modal
  var existing = document.getElementById('searchModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'searchModal';
  modal.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:3000;' +
    'overflow-y:auto;padding:80px 40px 40px;';

  var cardsHTML = items.map(function(item) {
    return (
      '<div style="background:#1c1c1c;border-radius:8px;overflow:hidden;cursor:pointer;" ' +
           'onclick="handleHeroInfo(' + item.tmdbId + ',\'' + item.mediaType + '\')">' +
        '<img src="' + esc(item.posterUrl) + '" alt="' + esc(item.title) + '" ' +
             'style="width:100%;display:block;" loading="lazy">' +
        '<div style="padding:10px;">' +
          '<div style="font-weight:700;font-size:0.88rem;margin-bottom:4px;">' + esc(item.title) + '</div>' +
          '<div style="color:#888;font-size:0.78rem;">' + esc(item.genre) + '</div>' +
          '<div style="color:#2ecc71;font-size:0.78rem;font-weight:700;">' + esc(item.score) + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  modal.innerHTML =
    '<div style="max-width:1200px;margin:0 auto;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">' +
        '<h2 style="font-size:1.5rem;font-weight:900;">Search results for "' + esc(query) + '"</h2>' +
        '<button onclick="document.getElementById(\'searchModal\').remove()" ' +
          'style="background:transparent;border:1px solid #555;color:#fff;padding:8px 18px;border-radius:4px;cursor:pointer;font-size:0.9rem;">✕ Close</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;">' +
        cardsHTML +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);
}

if (searchInput) {
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') runSearch();
  });
}
if (searchBtn) {
  searchBtn.addEventListener('click', runSearch);
}

// ═══════════════════════════════════════════════════════════════════
//  BOOT — Load all sections on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async function() {
  // Load TMDB content into grids
  // Make sure your index.html section grids have these IDs:
  //   id="gridTrending"  id="gridStudentPicks"  id="gridPopular"
  await Promise.all([
    loadTMDBSection('trending',       'gridTrending'),
    loadTMDBSection('anime',          'gridStudentPicks'),
    loadTMDBSection('popular-movies', 'gridPopular')
  ]);

  // Load dynamic hero slides (optional — comment out to keep static)
  // await loadHeroSlides();

  // Wire any static list buttons
  initListButtons();
});
