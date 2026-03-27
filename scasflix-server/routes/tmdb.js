/**
 * routes/tmdb.js
 * SCASFLIX — TMDB API Proxy Routes
 * FIXED: Return MORE movies (20+) instead of limiting to 8
 */

const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');

const TMDB_BASE  = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_BEARER_TOKEN;

const tmdbHeaders = {
  'Authorization': `Bearer ${TMDB_TOKEN}`,
  'Content-Type':  'application/json'
};

// ── Helper ───────────────────────────────────────────────────────────
async function tmdbFetch(path) {
  const res = await fetch(`${TMDB_BASE}${path}`, { headers: tmdbHeaders });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

// ── Genre map (TMDB genre IDs → readable names) ──────────────────────
const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy',
  80:'Crime', 99:'Documentary', 18:'Drama', 10751:'Family',
  14:'Fantasy', 36:'History', 27:'Horror', 10402:'Music',
  9648:'Mystery', 10749:'Romance', 878:'Sci-Fi', 10770:'TV Movie',
  53:'Thriller', 10752:'War', 37:'Western',
  10759:'Action & Adventure', 10762:'Kids', 10763:'News',
  10764:'Reality', 10765:'Sci-Fi & Fantasy', 10766:'Soap',
  10767:'Talk', 10768:'War & Politics'
};

function getGenreNames(ids) {
  if (!ids || !ids.length) return 'Unknown';
  return ids.slice(0, 2).map(id => GENRE_MAP[id] || '').filter(Boolean).join(' • ') || 'Unknown';
}

function formatScore(voteAverage) {
  return voteAverage ? Math.round(voteAverage * 10) + '% Match' : 'N/A';
}

function formatItem(item) {
  const isTV    = item.media_type === 'tv' || !!item.first_air_date;
  const title   = item.title || item.name || 'Unknown';
  const poster  = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : 'https://via.placeholder.com/300x450/1c1c1c/555?text=No+Image';

  return {
    id:        item.id,
    tmdbId:    item.id,
    title,
    mediaType: isTV ? 'tv' : 'movie',
    genre:     getGenreNames(item.genre_ids),
    score:     formatScore(item.vote_average),
    posterUrl: poster,
    overview:  item.overview || '',
    year:      (item.release_date || item.first_air_date || '').slice(0, 4),
    rating:    item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
  };
}

// ── Routes ───────────────────────────────────────────────────────────

// GET /api/tmdb/trending — Return 20 trending items
router.get('/trending', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/all/week?language=en-US');
    // Return up to 20 items (was 8)
    res.json(data.results.slice(0, 20).map(formatItem));
  } catch (err) {
    console.error('Trending error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/popular-tv — Return 20 TV shows
router.get('/popular-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/popular?language=en-US&page=1');
    // Return up to 20 items (was 8)
    res.json(data.results.slice(0, 20).map(i => formatItem({ ...i, media_type: 'tv' })));
  } catch (err) {
    console.error('Popular TV error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/popular-movies — Return 20 movies
router.get('/popular-movies', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/popular?language=en-US&page=1');
    // Return up to 20 items (was 8)
    res.json(data.results.slice(0, 20).map(i => formatItem({ ...i, media_type: 'movie' })));
  } catch (err) {
    console.error('Popular movies error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/anime — Return 20 anime
router.get('/anime', async (req, res) => {
  try {
    const data = await tmdbFetch(
      '/discover/tv?with_genres=16&sort_by=popularity.desc&language=en-US&page=1&with_origin_country=JP'
    );
    // Return up to 20 items (was 8)
    res.json(data.results.slice(0, 20).map(i => formatItem({ ...i, media_type: 'tv' })));
  } catch (err) {
    console.error('Anime error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/hero — 5 curated items for hero carousel
router.get('/hero', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/all/week?language=en-US');
    const items = data.results
      .filter(i => i.backdrop_path && i.overview)
      .slice(0, 5)
      .map(item => {
        const isTV = item.media_type === 'tv' || !!item.first_air_date;
        return {
          id:          item.id,
          title:       item.title || item.name,
          mediaType:   isTV ? 'tv' : 'movie',
          overview:    item.overview,
          score:       formatScore(item.vote_average),
          year:        (item.release_date || item.first_air_date || '').slice(0, 4),
          genre:       getGenreNames(item.genre_ids),
          backdropUrl: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
          posterUrl:   item.poster_path
            ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
            : ''
        };
      });
    res.json(items);
  } catch (err) {
    console.error('Hero error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/search?q=... — Search and return results
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query parameter ?q= is required' });
  try {
    const data = await tmdbFetch(
      `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`
    );
    const results = data.results
      .filter(i => i.media_type !== 'person' && i.poster_path)
      .slice(0, 20)  // Return up to 20 search results (was 12)
      .map(formatItem);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/detail/:type/:id
router.get('/detail/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!['movie', 'tv'].includes(type)) {
    return res.status(400).json({ error: 'Type must be movie or tv' });
  }
  try {
    const data = await tmdbFetch(`/${type}/${id}?language=en-US&append_to_response=credits`);
    res.json(data);
  } catch (err) {
    console.error('Detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
