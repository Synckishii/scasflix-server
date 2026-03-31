/* ═══════════════════════════════════════════════════════════════════
   SCASFLIX - STREAMING PLATFORM - JAVASCRIPT
═══════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const API_BASE = 'https://scasflix-server.onrender.com/api';
// For local development, use: 'http://localhost:5000/api'

const CONFIG = {
  movieCardWidth: 200,
  scrollAmount: 300,
  animationDuration: 300,
};

// ═══════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

let appState = {
  isLoggedIn: false,
  currentUser: null,
  currentMovie: null,
  myList: [],
  movies: {
    trending: [],
    popular: [],
    topRated: [],
  },
  isLoading: false,
};

// ═══════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════

const elements = {
  navbar: document.querySelector('.navbar'),
  authModal: document.getElementById('authModal'),
  movieModal: document.getElementById('movieModal'),
  videoModal: document.getElementById('videoModal'),
  // Updated to match actual index.html grid IDs
  trendingRow: document.getElementById('gridTrending'),
  popularRow: document.getElementById('gridPopular'),
  topRatedRow: document.getElementById('gridStudentPicks'),
  myListRow: document.getElementById('myListRow'),
  myListSection: document.getElementById('myListSection'),
  emptyListState: document.getElementById('emptyListState'),
  heroContent: document.getElementById('heroContent'),
  heroBackdrop: document.getElementById('heroBackdrop'),
  heroTitle: document.getElementById('heroTitle'),
  heroDescription: document.getElementById('heroDescription'),
  heroPlayBtn: document.getElementById('heroPlayBtn'),
  heroAddBtn: document.getElementById('heroAddBtn'),
  heroRating: document.getElementById('heroRating'),
  heroGenre: document.getElementById('heroGenre'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  toast: document.getElementById('toast'),
  searchInput: document.getElementById('navSearchInput'),
  searchBtn: document.getElementById('navSearchBtn'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  registerName: document.getElementById('registerName'),
  registerEmail: document.getElementById('registerEmail'),
  registerPassword: document.getElementById('registerPassword'),
  videoPlayer: document.getElementById('videoPlayer'),
  videoTitle: document.getElementById('videoTitle'),
  videoDescription: document.getElementById('videoDescription'),
};

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  loadMovies();
});

function initializeApp() {
  // Check if user is logged in (from localStorage)
  const savedUser = localStorage.getItem('scasflix_user');
  if (savedUser) {
    appState.currentUser = JSON.parse(savedUser);
    appState.isLoggedIn = true;
    updateAuthUI();
  }

  // Load My List from localStorage
  const savedList = localStorage.getItem('scasflix_mylist');
  if (savedList) {
    appState.myList = JSON.parse(savedList);
  }
}

function setupEventListeners() {
  // Navbar scroll effect
  window.addEventListener('scroll', handleNavbarScroll);

  // Search functionality
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Modal close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAuthModal();
      closeMovieModal();
      closeVideoModal();
    }
  });

  // Modal background click
  elements.authModal.addEventListener('click', (e) => {
    if (e.target === elements.authModal) closeAuthModal();
  });

  elements.movieModal.addEventListener('click', (e) => {
    if (e.target === elements.movieModal) closeMovieModal();
  });

  elements.videoModal.addEventListener('click', (e) => {
    if (e.target === elements.videoModal) closeVideoModal();
  });
}

// ═══════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

async function fetchFromAPI(endpoint) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Give Render extra time to wake up from cold start
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showLoading(false);
    return data;
  } catch (error) {
    console.error('API Error on ' + endpoint + ':', error.message);
    showLoading(false);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      showToast('Server is waking up... please refresh in 30 seconds.', 'error');
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showToast('Cannot reach server. Check your internet or Render deployment.', 'error');
    } else {
      showToast('Failed to load content: ' + error.message, 'error');
    }
    return null;
  }
}

// ── Render Wake-Up Ping ─────────────────────────────────────────────
// Free Render instances sleep after 15min. This pings the server first
// so it wakes up before the movie fetch.
async function pingServer() {
  try {
    const res = await fetch(API_BASE.replace('/api', '/'), {
      signal: AbortSignal.timeout(20000)
    });
    console.log('Server ping status:', res.status);
    return res.ok;
  } catch (e) {
    console.warn('Server ping failed:', e.message);
    return false;
  }
}

async function loadMovies() {
  try {
    // Ping the server first to wake it up (Render free tier cold start)
    showToast('Connecting to server...', 'info');
    await pingServer();

    // Load trending movies
    const trendingData = await fetchFromAPI('/tmdb/trending');
    if (trendingData) {
      appState.movies.trending = Array.isArray(trendingData)
        ? trendingData
        : trendingData.results || [];
      renderMovieRow(
        'gridTrending',
        appState.movies.trending,
        'trending'
      );

      // Set hero to first trending movie
      if (appState.movies.trending.length > 0) {
        setHeroMovie(appState.movies.trending[0]);
      }
    }

    // Load popular movies
    const popularData = await fetchFromAPI('/tmdb/popular-movies');
    if (popularData) {
      appState.movies.popular = Array.isArray(popularData)
        ? popularData
        : popularData.results || [];
      renderMovieRow('gridPopular', appState.movies.popular, 'popular');
    }

    // Load top rated movies
    const topRatedData = await fetchFromAPI('/tmdb/popular-tv');
    if (topRatedData) {
      appState.movies.topRated = Array.isArray(topRatedData)
        ? topRatedData
        : topRatedData.results || [];
      renderMovieRow('gridStudentPicks', appState.movies.topRated, 'toprated');
    }
  } catch (error) {
    console.error('Error loading movies:', error);
    showToast('Failed to load movies. Please refresh the page.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDERING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function renderMovieRow(elementId, movies, category) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Clear skeleton cards and show real content
  element.innerHTML = '';
  element.style.display = 'grid';

  if (!movies || movies.length === 0) {
    element.innerHTML =
      '<p style="color: #b3b3b3; padding: 2rem;">No movies found</p>';
    return;
  }

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    element.appendChild(card);
  });
}

function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';

  const posterUrl = movie.posterUrl
    ? movie.posterUrl
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : 'https://via.placeholder.com/200x300?text=No+Image';

  const title = movie.title || movie.name || 'Unknown';
  const rating = movie.rating
    ? Math.round(movie.rating * 10)
    : movie.vote_average
      ? Math.round(movie.vote_average * 10)
      : 'N/A';

  card.innerHTML = `
    <img src="${posterUrl}" alt="${title}" loading="lazy">
    <div class="movie-card-overlay">
      <div class="movie-card-title">${title}</div>
      <div class="movie-card-meta">
        <span>${rating}% • ${movie.year || new Date().getFullYear()}</span>
      </div>
      <div class="movie-card-actions">
        <button class="movie-card-btn" onclick="handlePlayClick(event, '${title}')">
          ▶ Play
        </button>
        <button class="movie-card-btn" onclick="handleAddToList(event, ${JSON.stringify(movie).replace(/"/g, '&quot;')})">
          + List
        </button>
      </div>
    </div>
  `;

  card.addEventListener('click', () => openMovieModal(movie));

  return card;
}

function setHeroMovie(movie) {
  const posterUrl = movie.backdropUrl
    ? movie.backdropUrl
    : movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : movie.posterUrl
        ? movie.posterUrl
        : 'https://via.placeholder.com/1400x400?text=Hero+Image';

  elements.heroBackdrop.style.backgroundImage = `url('${posterUrl}')`;
  elements.heroTitle.textContent = movie.title || movie.name || 'Unknown';
  elements.heroDescription.textContent =
    movie.overview || movie.description || 'No description available.';

  const rating = movie.rating
    ? Math.round(movie.rating * 10)
    : movie.vote_average
      ? Math.round(movie.vote_average * 10)
      : 'N/A';

  elements.heroRating.textContent = `${rating}% Match`;
  elements.heroGenre.textContent =
    movie.genre || movie.mediaType || 'Movie';

  // Store for play button
  appState.currentMovie = movie;

  // Hide skeleton, show content
  document.querySelector('.hero-skeleton').style.display = 'none';
  elements.heroContent.style.display = 'block';

  // Setup hero buttons
  elements.heroPlayBtn.onclick = () => playMovie(movie);
  elements.heroAddBtn.onclick = () => addToMyList(movie);
}

// ═══════════════════════════════════════════════════════════════════
// MODAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function openMovieModal(movie) {
  const posterUrl = movie.posterUrl
    ? movie.posterUrl
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : 'https://via.placeholder.com/300x450?text=No+Image';

  const backdropUrl = movie.backdropUrl
    ? movie.backdropUrl
    : movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : '';

  document.getElementById('modalBackdrop').style.backgroundImage =
    `url('${backdropUrl}')`;
  document.getElementById('modalPosterImg').src = posterUrl;
  document.getElementById('modalTitle').textContent =
    movie.title || movie.name || 'Unknown';
  document.getElementById('modalYear').textContent =
    movie.year || new Date().getFullYear();
  document.getElementById('modalRating').textContent = `${
    movie.rating
      ? Math.round(movie.rating * 10)
      : movie.vote_average
        ? Math.round(movie.vote_average * 10)
        : 'N/A'
  }%`;
  document.getElementById('modalGenre').textContent =
    movie.genre || movie.mediaType || 'Movie';
  document.getElementById('modalOverview').textContent =
    movie.overview || movie.description || 'No description available.';
  document.getElementById('modalCast').textContent =
    'Cast information not available';

  appState.currentMovie = movie;

  elements.movieModal.classList.add('active');
}

function closeMovieModal() {
  elements.movieModal.classList.remove('active');
}

function openAuthModal() {
  if (appState.isLoggedIn) {
    appState.isLoggedIn = false;
    appState.currentUser = null;
    localStorage.removeItem('scasflix_user');
    updateAuthUI();
    showToast('Logged out successfully', 'info');
    return;
  }

  elements.authModal.classList.add('active');
}

function closeAuthModal() {
  elements.authModal.classList.remove('active');
  // Reset forms
  document.getElementById('loginForm').classList.add('active');
  document.getElementById('registerForm').classList.remove('active');
  elements.loginEmail.value = '';
  elements.loginPassword.value = '';
  elements.registerName.value = '';
  elements.registerEmail.value = '';
  elements.registerPassword.value = '';
}

function toggleAuthForm() {
  document.getElementById('loginForm').classList.toggle('active');
  document.getElementById('registerForm').classList.toggle('active');
}

function openVideoModal(movie) {
  elements.videoTitle.textContent = movie.title || movie.name || 'Unknown';
  elements.videoDescription.textContent =
    movie.overview || 'Now playing...';

  // Set dummy video source (replace with real video URL)
  elements.videoPlayer.src =
    'https://www.w3schools.com/html/mov_bbb.mp4';

  elements.videoModal.classList.add('active');
  elements.videoPlayer.play();
}

function closeVideoModal() {
  elements.videoModal.classList.remove('active');
  elements.videoPlayer.pause();
  elements.videoPlayer.src = '';
}

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function handleLogin() {
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (!email.includes('@')) {
    showToast('Please enter a valid email', 'error');
    return;
  }

  // Simulate login (in real app, this would call backend)
  appState.isLoggedIn = true;
  appState.currentUser = {
    email,
    name: email.split('@')[0],
  };

  localStorage.setItem('scasflix_user', JSON.stringify(appState.currentUser));

  closeAuthModal();
  updateAuthUI();
  showToast(`Welcome back, ${appState.currentUser.name}!`, 'success');
}

function handleRegister() {
  const name = elements.registerName.value.trim();
  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value.trim();

  if (!name || !email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (!email.includes('@')) {
    showToast('Please enter a valid email', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  // Simulate registration
  appState.isLoggedIn = true;
  appState.currentUser = {
    name,
    email,
  };

  localStorage.setItem('scasflix_user', JSON.stringify(appState.currentUser));

  closeAuthModal();
  updateAuthUI();
  showToast(`Welcome to SCASFLIX, ${name}!`, 'success');
}

function updateAuthUI() {
  const authBtn = document.querySelector('.btn-auth');

  if (appState.isLoggedIn) {
    authBtn.textContent = `${appState.currentUser.name} (Sign Out)`;
    authBtn.style.background = '#2ecc71';
  } else {
    authBtn.textContent = 'Sign In';
    authBtn.style.background = '';
  }
}

// ═══════════════════════════════════════════════════════════════════
// MY LIST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function addToMyList(movie) {
  if (!appState.isLoggedIn) {
    showToast('Please sign in to add to your list', 'info');
    openAuthModal();
    return;
  }

  const movieId = movie.id || movie.tmdbId;

  if (appState.myList.some((m) => (m.id || m.tmdbId) === movieId)) {
    showToast('Movie is already in your list', 'info');
    return;
  }

  appState.myList.push(movie);
  localStorage.setItem('scasflix_mylist', JSON.stringify(appState.myList));

  showToast(`${movie.title || movie.name} added to your list!`, 'success');

  // Update My List row if it's visible
  if (appState.myList.length > 0) {
    document.getElementById('myListSection').style.display = 'block';
    document.getElementById('emptyListState').style.display = 'none';
    renderMovieRow('myListRow', appState.myList, 'mylist');
  }
}

function handleAddToList(event, movie) {
  event.stopPropagation();
  addToMyList(movie);
}

// ═══════════════════════════════════════════════════════════════════
// PLAYBACK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function playMovie(movie) {
  if (!appState.isLoggedIn) {
    showToast('Please sign in to watch movies', 'info');
    openAuthModal();
    return;
  }

  openVideoModal(movie || appState.currentMovie);
}

function handlePlayClick(event, title) {
  event.stopPropagation();

  if (!appState.isLoggedIn) {
    showToast('Please sign in to play movies', 'info');
    openAuthModal();
    return;
  }

  const movie = appState.currentMovie || {
    title,
    overview: 'Now playing...',
  };

  openVideoModal(movie);
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH FUNCTION
// ═══════════════════════════════════════════════════════════════════

async function handleSearch() {
  const query = elements.searchInput.value.trim();

  if (!query) {
    showToast('Please enter a search term', 'error');
    return;
  }

  showLoading(true);

  const results = await fetchFromAPI(
    `/tmdb/search?q=${encodeURIComponent(query)}`
  );

  showLoading(false);

  if (results && results.length > 0) {
    // Display search results (you can create a search results section)
    console.log('Search results:', results);
    showToast(`Found ${results.length} results for "${query}"`, 'success');
    
    // For demo, show in trending row
    renderMovieRow('gridTrending', results, 'search');
  } else {
    showToast(`No results found for "${query}"`, 'info');
  }

  elements.searchInput.value = '';
}

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function handleNavClick(section) {
  if (section === 'mylist') {
    if (appState.myList.length === 0) {
      document.getElementById('myListSection').style.display = 'block';
      document.getElementById('emptyListState').style.display = 'block';
    } else {
      document.getElementById('myListSection').style.display = 'block';
      document.getElementById('emptyListState').style.display = 'none';
      renderMovieRow('myListRow', appState.myList, 'mylist');
    }
  }

  // Close mobile menu if open
  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    navMenu.style.display = 'none';
  }
}

function handleNavbarScroll() {
  if (window.scrollY > 50) {
    elements.navbar.classList.add('scrolled');
  } else {
    elements.navbar.classList.remove('scrolled');
  }
}

// ═══════════════════════════════════════════════════════════════════
// UI FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function showLoading(show) {
  appState.isLoading = show;
  elements.loadingIndicator.classList.toggle('active', show);
}

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function formatDate(dateString) {
  if (!dateString) return new Date().getFullYear();
  return new Date(dateString).getFullYear();
}

function truncateText(text, maxLength = 150) {
  if (!text) return '';
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text;
}
