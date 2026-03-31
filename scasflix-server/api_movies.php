<?php

// Set the header so the browser knows this is JSON data
header('Content-Type: application/json');

// Allow requests from the frontend (CORS support for local dev)
header('Access-Control-Allow-Origin: *');

// This acts as our "Database" for now
$movies = [
  [
    "title"    => "Gundam Seed Freedom",
    "category" => "Anime",
    "image"    => "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHkjJDVEs80.jpg"
  ],
  [
    "title"    => "The Dark Knight",
    "category" => "Action",
    "image"    => "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
  ],
  [
    "title"    => "Interstellar",
    "category" => "Sci-Fi",
    "image"    => "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"
  ],
  [
    "title"    => "Your Name",
    "category" => "Anime",
    "image"    => "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg"
  ]
];

// Convert the PHP array into a JSON string and output it
echo json_encode($movies);

?>
