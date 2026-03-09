# SCASFLIX — Full Stack Setup Guide
## Stack: Node.js + Express + MongoDB Atlas + TMDB API

---

## FOLDER STRUCTURE

```
scasflix-server/
├── .env                        ← Your secret keys (NEVER commit this)
├── package.json
├── server.js                   ← Express entry point
├── routes/
│   ├── tmdb.js                 ← TMDB proxy routes
│   ├── auth.js                 ← Signup / Signin
│   ├── list.js                 ← My List (per user per profile)
│   └── profiles.js             ← Rename / PIN management
├── models/
│   ├── User.js                 ← MongoDB User schema
│   └── MyList.js               ← MongoDB MyList schema
├── middleware/
│   └── authMiddleware.js       ← JWT guard
│
│   ── FRONTEND FILES (put these in your website folder) ──
├── auth.js                     ← Replace your old auth.js
├── script.js                   ← Replace your old script.js
├── index.html                  ← Replace your old index.html
├── login.html                  ← Replace your old login.html
└── mylist.html                 ← Replace your old mylist.html
```

---

## STEP 1 — Install Dependencies

```bash
cd scasflix-server
npm install
```

---

## STEP 2 — Fill in .env

Open `.env` and replace the placeholder values:

```
TMDB_BEARER_TOKEN=   ← Paste your TMDB Bearer Token (starts with eyJ...)
MONGO_URI=           ← Paste your MongoDB Atlas connection string
JWT_SECRET=          ← Keep as-is or change to any long random string
```

### Get TMDB Token:
1. Go to https://www.themoviedb.org → Settings → API
2. Copy the "API Read Access Token" (long eyJ... string)

### Get MongoDB URI:
1. Go to https://cloud.mongodb.com
2. Create free cluster → Connect → Drivers → Node.js
3. Copy the connection string, replace <password> with your DB user password

---

## STEP 3 — Start the Server

```bash
# Normal start
node server.js

# Auto-restart on file changes (development)
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 SCASFLIX server running on http://localhost:5000
```

---

## STEP 4 — Update Your Frontend Files

Copy these files into your website folder (same folder as styles.css, profile.html, pin.html, etc.):
- auth.js       → replaces the old auth.js
- script.js     → replaces the old script.js
- index.html    → replaces the old index.html
- login.html    → replaces the old login.html
- mylist.html   → replaces the old mylist.html

Keep these files unchanged (they work as-is):
- styles.css
- profile.html + profile.js + profile.css
- pin.html + pin.js + pin.css
- navbar.js
- carousel.js
- contact.js

---

## STEP 5 — Open Your Website

Use VS Code Live Server or any local server on port 5500:
http://localhost:5500/index.html

The frontend talks to your backend at http://localhost:5000

---

## API ENDPOINTS REFERENCE

| Method | Endpoint                        | Auth? | Description              |
|--------|---------------------------------|-------|--------------------------|
| POST   | /api/auth/signup                | No    | Create account           |
| POST   | /api/auth/signin                | No    | Login, returns JWT       |
| GET    | /api/tmdb/trending              | No    | Trending this week       |
| GET    | /api/tmdb/anime                 | No    | Japanese anime           |
| GET    | /api/tmdb/popular-movies        | No    | Popular movies           |
| GET    | /api/tmdb/popular-tv            | No    | Popular TV shows         |
| GET    | /api/tmdb/hero                  | No    | Hero carousel data       |
| GET    | /api/tmdb/search?q=query        | No    | Search titles            |
| GET    | /api/tmdb/detail/:type/:id      | No    | Movie/TV detail          |
| GET    | /api/list/:slot                 | Yes   | Get My List              |
| POST   | /api/list/:slot                 | Yes   | Add to My List           |
| DELETE | /api/list/:slot/:tmdbId         | Yes   | Remove from My List      |
| GET    | /api/profiles                   | Yes   | Get all profiles         |
| PUT    | /api/profiles/:slot/rename      | Yes   | Rename profile           |
| PUT    | /api/profiles/:slot/pin         | Yes   | Set/change PIN           |
| DELETE | /api/profiles/:slot/pin         | Yes   | Remove PIN               |
| POST   | /api/profiles/:slot/verify-pin  | Yes   | Verify PIN               |

---

## TROUBLESHOOTING

**"Cannot connect to server"**
→ Make sure `node server.js` is running in your terminal

**"MongoDB connection error"**
→ Check your MONGO_URI in .env
→ Make sure your IP is whitelisted in MongoDB Atlas (Network Access → 0.0.0.0/0)

**"TMDB fetch failed"**
→ Check your TMDB_BEARER_TOKEN in .env
→ Make sure it's the long Bearer token, not the short API key

**CORS errors in browser**
→ Make sure your server is running on port 5000
→ The API_BASE in auth.js should be 'http://localhost:5000/api'
