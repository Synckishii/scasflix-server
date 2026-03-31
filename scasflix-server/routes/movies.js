/**
 * routes/movies.js
 * SCASFLIX — Lab Activity 8: Node.js equivalent of api_movies.php
 * Used when the frontend is on GitHub Pages (can't run PHP).
 *
 * Endpoint: GET /api/movies
 */

const express = require('express');
const router  = express.Router();

// Same movies as api_movies.php — kept in sync
const movies = [
  {
    title:    'Gundam Seed Freedom',
    category: 'Anime',
    image:    'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHkjJDVEs80.jpg'
  },
  {
    title:    'The Dark Knight',
    category: 'Action',
    image:    'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
  },
  {
    title:    'Interstellar',
    category: 'Sci-Fi',
    image:    'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg'
  },
  {
    title:    'Your Name',
    category: 'Anime',
    image:    'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg'
  }
];

// GET /api/movies
router.get('/', (req, res) => {
  res.json(movies);
});

module.exports = router;
