/* ═══════════════════════════════════════════════════════════════════
   SCASFLIX - STREAMING PLATFORM - JAVASCRIPT
   Fixed: Works with actual index.html DOM structure
   Lab 8: PHP fetch integration via api_movies.php
═══════════════════════════════════════════════════════════════════ */

const API_BASE = 'https://scasflix-server.onrender.com/api';
// For local development, use: 'http://localhost:5000/api'

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  loadMovies();
  loadMoviesFromPHP(); // Lab 8: PHP fetch integration
});

// ═══════════════════════════════════════════════════════════════════
// SEARCH SETUP
// ═══════════════════════════════════════════════════════════════════

function setupSearch() {
  var searchBtn   = document.getElementById('navSearchBtn');
  var searchInput = document.getElementById('navSearchInput');
  if (!searchBtn || !searchInput) return;

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleSearch();
  });
}

async function handleSearch() {
  var searchInput = document.getElementById('navSearchInput');
  if (!searchInput) return;
  var query = searchInput.value.trim();
  if (!query) { showToast('Please enter a search term.', 'error'); return; }

  var results = await fetchFromAPI('/tmdb/search?q=' + encodeURIComponent(query));
  if (results && results.length > 0) {
    renderMovieRow('gridTrending', results);
    showToast('Found ' + results.length + ' results for "' + query + '"', 'success');
  } else {
    showToast('No results found for "' + query + '"', 'info');
  }
  searchInput.value = '';
}

// ═══════════════════════════════════════════════════════════════════
// API — TMDB (via Express server)
// ═══════════════════════════════════════════════════════════════════

async function fetchFromAPI(endpoint) {
  try {
    var response = await fetch(API_BASE + endpoint, {
      method:  'GET',
      headers: { 'Content-Type': 'application/json' },
      signal:  AbortSignal.timeout(20000)
    });

    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.json();

  } catch (error) {
    console.error('API Error on ' + endpoint + ':', error.message);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      showToast('Server is waking up... please refresh in 30 seconds.', 'error');
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showToast('Cannot reach server. Check your connection.', 'error');
    }
    return null;
  }
}

// Ping Render free tier to wake it up before fetching
async function pingServer() {
  try {
    var res = await fetch(API_BASE.replace('/api', '/'), {
      signal: AbortSignal.timeout(20000)
    });
    return res.ok;
  } catch (e) {
    console.warn('Server ping failed:', e.message);
    return false;
  }
}

async function loadMovies() {
  try {
    showToast('Connecting to server...', 'info');
    await pingServer();

    // Trending
    var trendingData = await fetchFromAPI('/tmdb/trending');
    if (trendingData) {
      var trending = Array.isArray(trendingData) ? trendingData : (trendingData.results || []);
      renderMovieRow('gridTrending', trending);
    }

    // Popular Movies
    var popularData = await fetchFromAPI('/tmdb/popular-movies');
    if (popularData) {
      var popular = Array.isArray(popularData) ? popularData : (popularData.results || []);
      renderMovieRow('gridPopular', popular);
    }

    // Popular TV / Student Picks
    var tvData = await fetchFromAPI('/tmdb/popular-tv');
    if (tvData) {
      var tv = Array.isArray(tvData) ? tvData : (tvData.results || []);
      renderMovieRow('gridStudentPicks', tv);
    }

  } catch (error) {
    console.error('Error loading movies:', error);
    showToast('Failed to load movies. Please refresh.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════
// LAB 8 — PHP FETCH INTEGRATION (api_movies.php)
// Task: fetch movies from PHP backend and display them in a section
// ═══════════════════════════════════════════════════════════════════

function loadMoviesFromPHP() {
  var container = document.getElementById('php-movie-container');
  if (!container) return; // Section not in index.html, skip silently

  fetch('api_movies.php')
    .then(function (response) {
      if (!response.ok) throw new Error('Server responded with ' + response.status);
      return response.json();
    })
    .then(function (data) {
      container.innerHTML = '';
      data.forEach(function (movie) {
        var card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML =
          '<img src="' + movie.image + '" alt="' + movie.title + '" loading="lazy">' +
          '<div class="movie-card-body">' +
            '<h6>' + movie.title + '</h6>' +
            '<p>' + movie.category + '</p>' +
          '</div>';
        container.appendChild(card);
      });
    })
    .catch(function (error) {
      console.error('Error fetching movies:', error);
      // Lab 8 Assessment: Graceful error message for users
      if (container) {
        container.innerHTML =
          '<p style="color:#b3b3b3;padding:2rem;grid-column:1/-1;">' +
          'Sorry, the SCASFlix server is currently undergoing maintenance. ' +
          'Please try again later.</p>';
      }
    });
}

// ═══════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════

function renderMovieRow(elementId, movies) {
  var element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = '';

  if (!movies || movies.length === 0) {
    element.innerHTML = '<p style="color:#b3b3b3;padding:2rem;">No movies found</p>';
    return;
  }

  movies.forEach(function (movie) {
    element.appendChild(createMovieCard(movie));
  });
}

function createMovieCard(movie) {
  var card = document.createElement('div');
  card.className = 'movie-card';

  var posterUrl = movie.posterUrl
    ? movie.posterUrl
    : movie.poster_path
      ? 'https://image.tmdb.org/t/p/w300' + movie.poster_path
      : 'https://via.placeholder.com/200x300?text=No+Image';

  var title = movie.title || movie.name || 'Unknown';
  var rating = movie.rating
    ? Math.round(movie.rating * 10)
    : movie.vote_average
      ? Math.round(movie.vote_average * 10)
      : 'N/A';

  var genre  = movie.genre || movie.mediaType || 'Movie';
  var score  = rating + '%';
  var tmdbId = movie.id || movie.tmdbId || 0;

  card.innerHTML =
    '<img src="' + posterUrl + '" alt="' + esc(title) + '" loading="lazy">' +
    '<div class="movie-card-body">' +
      '<h6>' + esc(title) + '</h6>' +
      '<p>'  + esc(genre) + '</p>' +
      '<span class="badge-sm">' + score + '</span>' +
      '<button class="btn-add-list" ' +
        'data-tmdbid="' + tmdbId + '" ' +
        'data-type="' + esc(movie.media_type || 'movie') + '" ' +
        'data-title="' + esc(title) + '" ' +
        'data-genre="' + esc(genre) + '" ' +
        'data-poster="' + esc(posterUrl) + '" ' +
        'data-score="' + esc(score) + '">' +
        '+ My List' +
      '</button>' +
    '</div>';

  // Add to list handler
  var btn = card.querySelector('.btn-add-list');
  btn.addEventListener('click', async function (e) {
    e.stopPropagation();
    var profile = getActiveProfile();
    if (!profile) { showToast('Please select a profile first.', 'error'); return; }

    var id = parseInt(btn.getAttribute('data-tmdbid'));
    if (await isInList(id)) {
      showToast('"' + btn.getAttribute('data-title') + '" is already in your list.', 'info');
      return;
    }

    await addToList(
      id,
      btn.getAttribute('data-type'),
      btn.getAttribute('data-title'),
      btn.getAttribute('data-genre'),
      btn.getAttribute('data-poster'),
      btn.getAttribute('data-score')
    );
    showToast('"' + btn.getAttribute('data-title') + '" added to My List!', 'success');
  });

  return card;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

function showToast(message, type) {
  // Delegate to auth.js showToast if available, otherwise fallback
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = 'toast-alert ' + (type || 'info');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () {
    toast.className = 'toast-alert hidden';
  }, 4500);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
