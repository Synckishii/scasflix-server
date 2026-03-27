  /**
   * script.js
   * SCASFLIX — Main Frontend Logic (TMDB + MongoDB version)
   * Enhanced with Top 10 Picks and full functionality
   */

  var API_BASE = 'https://scasflix-server.onrender.com/api';
  var IMG_BASE = 'https://image.tmdb.org/t/p/w300';

  // ═══════════════════════════════════════════════════════════════════
  //  TMDB SECTION LOADER
  // ═══════════════════════════════════════════════════════════════════

  async function loadTMDBSection(endpoint, gridId) {
    var grid = document.getElementById(gridId);
    if (!grid) return;

    try {
      var res   = await fetch(API_BASE + '/tmdb/' + endpoint);
      var items = await res.json();

      if (!Array.isArray(items) || items.length === 0) {
        grid.innerHTML = '<p style="color:#555;padding:20px;">No content available.</p>';
        return;
      }

      grid.innerHTML = '';
      
      // Load ALL items - NO LIMIT
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
  //  TOP 10 PICKS LOADER
  // ═══════════════════════════════════════════════════════════════════

  async function loadTop10Picks() {
    var grid = document.getElementById('gridTop10');
    if (!grid) return;

    try {
      // Load popular movies and TV shows, then combine and sort by rating
      var moviesRes = await fetch(API_BASE + '/tmdb/popular-movies');
      var tvRes = await fetch(API_BASE + '/tmdb/popular-tv');
      
      var movies = await moviesRes.json();
      var tvShows = await tvRes.json();
      
      var combined = [...movies, ...tvShows];
      
      // Sort by score (rating) descending
      combined.sort((a, b) => {
        var scoreA = parseFloat(a.score) || 0;
        var scoreB = parseFloat(b.score) || 0;
        return scoreB - scoreA;
      });

      var top10 = combined.slice(0, 10);

      if (top10.length === 0) {
        grid.innerHTML = '<p style="color:#555;padding:20px;">No content available.</p>';
        return;
      }

      grid.innerHTML = '';
      for (var i = 0; i < top10.length; i++) {
        var item = top10[i];
        var inList = typeof isInList === 'function' ? await isInList(item.tmdbId) : false;
        var card = buildMovieCard(item, inList);
        // Add ranking badge
        var rankBadge = document.createElement('div');
        rankBadge.style.cssText = 'position:absolute;top:10px;left:10px;background:#f39c12;color:#000;padding:4px 8px;border-radius:4px;font-weight:700;font-size:0.9rem;z-index:5;';
        rankBadge.textContent = '#' + (i + 1);
        card.style.position = 'relative';
        card.appendChild(rankBadge);
        grid.appendChild(card);
      }

    } catch (err) {
      console.error('Top 10 load error:', err);
      grid.innerHTML = '<p style="color:#555;padding:20px;">Could not load Top 10. Is the server running?</p>';
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

  // ── Re-wire static add-list buttons ──
  function initListButtons() {
    var btns = document.querySelectorAll('.add-list-btn[data-title]');
    btns.forEach(function(btn) {
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener('click', function() { toggleListBtn(btn); });
    });
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

      showSearchResults(query, items);
      if (searchInput) searchInput.value = '';

    } catch (err) {
      showToast('Search failed. Is the server running?', 'error');
    }
  }

  function showSearchResults(query, items) {
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
            'onclick="handleHeroInfo(' + item.id + ',\'' + item.mediaType + '\')">' +
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
    await Promise.all([
      loadTMDBSection('trending',       'gridTrending'),
      loadTop10Picks(),
      loadTMDBSection('anime',          'gridStudentPicks'),
      loadTMDBSection('popular-movies', 'gridPopular')
    ]);

    initListButtons();
  });
