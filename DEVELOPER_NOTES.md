# Question Bank

A centralized platform where university students can find, browse, search, upload, and manage previous exam questions — organized by course, faculty, semester, and exam type.

Built as a clean, minimal, anonymous academic utility rather than a social platform.

---

## Features

- **Browse & search** previous questions by course, faculty, department, semester, year, and exam type, with backend pagination and sorting (newest, oldest, most viewed, most downloaded).
- **Upload** questions as typed text and/or a PDF/image file.
- **Edit / delete** your own questions (enforced server-side, not just hidden buttons).
- **Anonymous by design**: your real name and email are never shown to other students. Every account has a public, pseudonymous `username` instead. Uploads are attributed to that username only.
- **Public profile pages** (`profile.html?u=username`) so juniors can see everything a given uploader has shared, without knowing who they really are.
- **Blessings**: a lightweight "thanks" a student can send an uploader (one per question).
- **Bookmarks**: save questions to find again later.
- **Reports**: flag a question for moderator review.
- View/download counters on every question.
- Secure auth: bcrypt-hashed passwords, JWT sessions, ownership checks on every write.
- Fully responsive layout — no horizontal scrolling, mobile nav, stacked filters on small screens.

---

## Tech stack

**Frontend:** HTML5, CSS3, vanilla JavaScript (no framework, no build step)
**Backend:** Node.js, Express.js, REST API
**Database:** MySQL (mysql2 driver, parameterized queries throughout)
**Auth:** bcrypt password hashing + JWT
**File uploads:** Multer, stored locally under `backend/uploads/` (swappable for cloud storage later — only the file *path* is stored in MySQL)

---

## Folder structure

```
question-bank/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/                # env loader, MySQL pool
│   ├── routes/                # one file per resource
│   ├── controllers/           # request handlers / business logic
│   ├── middleware/            # auth, upload, error handling
│   ├── utils/                 # jwt, validators, async wrapper
│   ├── db/                    # schema.sql, seed.sql
│   ├── uploads/                # local file storage (gitignored)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── index.html, browse.html, question.html, upload.html,
    │   login.html, register.html, my-questions.html, profile.html
    ├── css/style.css
    └── js/
        ├── config.js           # API base URL
        ├── api.js               # fetch wrapper
        ├── auth.js              # session helpers
        ├── components.js        # navbar, toasts, states, pagination
        └── pages/               # one script per page
```

---

## Database setup

1. Install MySQL (or MariaDB) and make sure it's running.
2. Create the schema:
   ```bash
   mysql -u root -p < backend/db/schema.sql
   ```
3. (Optional) Load some starter departments/courses/faculties/semesters:
   ```bash
   mysql -u root -p < backend/db/seed.sql
   ```

The schema creates: `users`, `departments`, `faculties`, `courses`, `semesters`, `questions`, `bookmarks`, `blessings`, `reports` — all normalized, with foreign keys and indexes on the columns used for search/filtering (course, faculty, semester, year, content type), plus a FULLTEXT index for question search.

---

## Environment setup

Copy the example env file and fill in your own values:

```bash
cd backend
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Long random string used to sign auth tokens |
| `JWT_EXPIRES_IN` | Session length, e.g. `7d` |
| `FRONTEND_URL` | Deployed frontend origin, used for CORS |
| `MAX_FILE_SIZE_MB` | Upload size limit |

Never commit `.env` — it's already in `.gitignore`.

---

## Running locally

**Backend:**
```bash
cd backend
npm install
npm run dev        # or: npm start
```
The API runs at `http://localhost:5000/api` by default.

**Frontend:**
The frontend is plain static files — serve them with any static server, e.g.:
```bash
cd frontend
npx serve .
# or
python3 -m http.server 8080
```
Open `http://localhost:8080`. `frontend/js/config.js` automatically points to `http://localhost:5000/api` when running on `localhost`.

---

## API overview

All responses are JSON with a `success` boolean. Errors use standard HTTP status codes (400/401/403/404/500).

**Auth**
- `POST /api/auth/register` — name, email, studentId (format `2024-3-60-082`), password, confirmPassword
- `POST /api/auth/login` — email, password
- `GET /api/auth/me` — current user (requires auth)

**Questions**
- `GET /api/questions` — list with `search, course, faculty, department, semester, year, examType, sort, page, limit` query params
- `GET /api/questions/:id` — details (increments view count)
- `POST /api/questions` — create (auth required, multipart form for optional file)
- `PUT /api/questions/:id` — update (owner or admin only)
- `DELETE /api/questions/:id` — delete (owner or admin only)
- `GET /api/questions/:id/download` — downloads the attached file, increments download count
- `POST /api/questions/:id/bookmark` — toggle bookmark
- `POST /api/questions/:id/blessing` — toggle a "blessing" (thanks) to the uploader
- `POST /api/questions/:id/report` — report a question
- `GET /api/questions/mine` — your own uploads
- `GET /api/questions/bookmarks/mine` — your bookmarks

**Lookups**
- `GET /api/courses?q=`, `GET /api/faculties?q=`, `GET /api/departments`, `GET /api/semesters`

**Profiles**
- `GET /api/profiles/:username` — public, anonymous profile with upload stats

---

## Security notes

- Passwords are hashed with bcrypt, never stored or returned in plain text.
- All database access uses parameterized queries (no string-concatenated SQL).
- Every write endpoint checks ownership/role server-side — frontend buttons being hidden is never the only protection.
- Uploaded files get randomly generated filenames; the original filename is never trusted or used on disk.
- CORS is restricted to `FRONTEND_URL`.

---

## Deployment

- **Frontend → Netlify**: drag-and-drop or connect the `frontend/` folder as the publish directory. Update `frontend/js/config.js` with your deployed backend's URL (the file already switches based on hostname, so replace the placeholder for the production branch).
- **Backend → any free-tier Node host** (Render, Railway, Fly.io, etc.): deploy the `backend/` folder, set the environment variables from `.env.example` in the host's dashboard, and set `FRONTEND_URL` to your Netlify URL.
- **Database → any managed MySQL** (PlanetScale, Railway, Aiven, etc.): run `schema.sql` against it and point `DB_HOST`/`DB_USER`/etc. at the cloud instance.
- File uploads currently save to local disk (`backend/uploads/`). For a host with an ephemeral filesystem, swap `middleware/upload.js`'s disk storage for a cloud storage SDK (e.g. S3) — the rest of the app only ever touches `file_url`, so this is a contained change.

---

## Development stages (as built)

1. Project structure + frontend layout
2. MySQL schema
3. Express backend skeleton
4. Authentication (register/login/JWT)
5. Question CRUD
6. Search and filtering
7. File uploads
8. Bookmarks, blessings, reports
9. Responsive UI refinement
10. Deployment preparation (env vars, README, .gitignore)
