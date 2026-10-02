# Netflix Clone — Full-Stack Streaming Catalog

A full-stack movie browsing app: a **React** single-page frontend backed by a **Django REST Framework** API with **JWT authentication** and a **PostgreSQL**-ready data layer.

![CI](https://github.com/<your-username>/netflix-clone-fullstack/actions/workflows/ci.yml/badge.svg)

**Live demo:** _add your Vercel/Netlify URL_ · **API docs (Swagger):** _add `https://<your-api>.onrender.com/api/docs/`_

> Screenshots: add 2–3 images of the home page, movie detail page, and the mobile sidebar to a `docs/` folder and link them here.

## Architecture

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| FE[React + Vite SPA<br/>Vercel / Netlify]
    FE -->|REST + JWT Bearer| API[Django REST Framework<br/>gunicorn on Render]
    API --> DB[(PostgreSQL<br/>SQLite locally)]
    API -.->|OpenAPI schema| DOCS[Swagger UI /api/docs/]
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Vite, SCSS (Sass), Axios, Context API + custom hooks |
| Backend | Python 3.12, Django 5, Django REST Framework, Simple JWT, drf-spectacular (OpenAPI) |
| Database | PostgreSQL in production (via `DATABASE_URL`), SQLite for local development |
| Security | JWT access/refresh tokens, PBKDF2 password hashing, scoped rate limiting, CORS allow-list |
| DevOps | GitHub Actions CI, Render Blueprint (`render.yaml`), WhiteNoise, gunicorn |
| Testing | Django `APITestCase` (63 tests) |

## Features

**Backend**
- Email-based custom user model with signup / login / token refresh
- Movie catalog CRUD — public reads, authenticated writes
- Server-side validation (genre choices, year range, URL format, blank titles)
- Query filters: `?genre=`, `?search=`, `?featured=true`
- Rate limiting on auth endpoints, uniform "invalid credentials" errors (no email enumeration)
- **Top 10 Trending** — `GET /movies/trending/` ranks the 10 most-viewed titles live from a real `views_count`
  incremented on each detail-page hit, recomputed on every request (not a fixed, hand-picked list)
- **Trailers** — attach a YouTube trailer per language per movie (`/movies/{id}/trailers/`); accepts a full
  YouTube URL or a bare video id, normalizes and validates it server-side
- Auto-generated OpenAPI schema + interactive Swagger UI
- Idempotent seed command (3 demo users, 10 movies with starting view counts), health-check endpoint

**Frontend**
- Protected routes, persistent sessions, **silent token refresh** via an Axios interceptor
- Hero banner, **Top 10 Trending row** (big-numeral treatment), genre rows, genre pages, live search,
  multi-genre filters, sorting, shuffle
- **Trailer playback** — a "Play Trailer" button on the movie card, detail page, and admin form opens a modal
  with a YouTube embed; a movie with trailers in more than one language shows tabs to switch between them
- Watchlist, recently viewed, personal star ratings, "More like this"
- **Multi-language UI** — English, Hindi, Spanish, and French, switchable from the navbar or footer, persisted
  per device (`src/i18n/` — a small hand-rolled dictionary system, no external i18n library; adding a language
  is one new dictionary file). Covers navigation, footer, the marketing/FAQ/trailer UI, and the legal pages;
  the movie catalog itself, auth forms, and admin tooling stay in English (extend the same way if needed)
- **FAQ, Help Centre, Contact, Terms, Privacy** pages, linked from a new footer
- **"More reasons to join"** marketing section shown to signed-out visitors
- Admin table with inline edit/delete + CSV export; validated create/edit form with per-language trailer management
- Fully responsive — navbar collapses into an accessible sidebar under 768px; dark/light themes
- Skeleton loaders, offline banner, skip-to-content link, dynamic page titles

## API overview

Base path: `/api` — full interactive docs at `/api/docs/`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup/` | – | Create account → `{user, tokens}` |
| POST | `/auth/login/` | – | Log in → `{user, tokens}` |
| POST | `/auth/refresh/` | – | Exchange refresh token → `{access}` |
| GET | `/movies/` | – | List movies (`?genre=`, `?search=`, `?featured=`) |
| GET | `/movies/trending/` | – | Top 10 by live in-app views |
| GET | `/movies/{id}/` | – | Movie detail (includes `views_count`, nested `trailers`) |
| POST | `/movies/` | JWT | Create movie |
| PUT / PATCH | `/movies/{id}/` | JWT | Full / partial update |
| DELETE | `/movies/{id}/` | JWT | Delete movie |
| GET | `/movies/{id}/trailers/` | – | List trailers for a title |
| POST | `/movies/{id}/trailers/` | JWT | Add/replace a trailer `{language, youtube_id, label?}` |
| DELETE | `/movies/{id}/trailers/{trailer_id}/` | JWT | Remove a trailer |
| GET | `/health/` | – | Liveness probe |

## Getting started

Prerequisites: Python 3.12+, Node 20+.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data # demo users + movies
python manage.py runserver # http://127.0.0.1:8000
```

Demo login: `alice@example.com` / `pass1234` (also `bob@…`, `charlie@…`).
Optional admin panel: `python manage.py createsuperuser` → `/admin/`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev # http://localhost:5173
```

### 3. Tests

```bash
cd backend && python manage.py test        # 63 tests
cd frontend && npm run build               # production build check
```

## Configuration (backend `.env`)

| Variable | Purpose | Default |
|---|---|---|
| `SECRET_KEY` | Django signing key — **set a long random value in production** | dev placeholder |
| `DEBUG` | Debug mode | `False` |
| `DATABASE_URL` | e.g. `postgres://user:pass@host:5432/db` | local SQLite file |
| `ALLOWED_HOSTS` | Comma-separated hostnames | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Frontend origins allowed to call the API | Vite dev URLs |
| `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS` | Token lifetimes | `1440` / `90` |
| `THROTTLE_AUTH` | Auth endpoint rate limit | `20/min` |

## Deployment

**API → Render.** Push this repo to GitHub, then Render → *New → Blueprint* → select the repo. `render.yaml` provisions the web service and a PostgreSQL database, runs `build.sh` (install, collectstatic, migrate, seed), and health-checks `/api/health/`. Free instances sleep when idle, so the first request after a pause can take 20–30 s, and free-tier database retention limits change over time — check Render's current terms, or point `DATABASE_URL` at any Postgres host (Neon, Supabase, …).

**Frontend → Vercel/Netlify.** Root directory `frontend`, build `npm run build`, output `dist`, env `VITE_API_BASE_URL=https://<your-api>.onrender.com/api`. Deep-link rewrites are pre-configured.

**Finally**, set the API's `CORS_ALLOWED_ORIGINS` to your deployed frontend URL (no trailing slash), then redeploy the API.

## Project structure

```
netflix-clone-fullstack/
├── backend/
│   ├── config/            settings, urls, wsgi/asgi
│   ├── accounts/          custom User model, auth serializers/views, tests
│   ├── movies/            Movie model, viewset, seed command, tests
│   ├── requirements.txt
│   └── build.sh           Render build step
├── frontend/
│   └── src/               api, components, context, hooks, pages, styles
├── .github/workflows/ci.yml
└── render.yaml
```

## Design decisions & trade-offs

- **Custom email `User` model from day one** — swapping the user model after the first migration is painful, so email login is built in from the start.
- **Same error for unknown email vs. wrong password**, plus a scoped throttle, to blunt account enumeration and credential stuffing.
- **Unpaginated movie list** — the catalog is small and the client expects a plain array; server-side `?search=` / `?genre=` exist for when that stops being true (next step: add pagination).
- **Tokens in `localStorage`** — simple and fine for a portfolio app, but exposed to XSS; a production hardening step is HttpOnly cookies.
- **Any authenticated user can edit any movie** — matches the original API contract; adding per-owner permissions is a natural extension.
- **Trailers store a video id, not a video** — a title's trailer is embedded via YouTube's own privacy-enhanced player (`youtube-nocookie.com`); the app only stores which official video id to show, so playback stays free and legal without hosting any media itself. No trailer ids are hardcoded in the seed data — attach real ones per title (and per language) from the movie edit form, since a guessed id could point at an unofficial or dead upload.
- **"Top 10 Trending" is computed, not curated** — ranked live from `Movie.views_count`, incremented once per detail-page request. It reflects real in-app engagement and moves as the catalog is used, rather than a fixed editorial list.
- **i18n is a flat dictionary, not a library** — `src/i18n/` is ~15 lines of context/hook code plus one file per language; enough for this app's scope without an external dependency. It covers the app's chrome (nav, footer, FAQ, marketing, trailer UI); the catalog itself and admin tooling are English-only, matching how most real streaming sites treat operator-facing tools.

## Roadmap

- Server-side watchlist and shared ratings/reviews (new models + endpoints)
- Pagination and ownership permissions
- Real poster uploads to object storage (S3 / Cloudinary)
- Docker Compose for one-command local setup
- Translate the movie catalog and auth/admin screens for full i18n coverage
