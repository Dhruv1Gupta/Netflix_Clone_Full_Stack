# Netflix Clone — Frontend

React 18 + Vite + SCSS single-page app for the Netflix Clone API in [`../backend`](../backend).

```bash
npm install
cp .env.example .env      # VITE_API_BASE_URL defaults to http://127.0.0.1:8000/api
npm run dev               # http://localhost:5173
npm run build             # production build -> dist/
```

## What's inside

- **Routing** — React Router with public pages and `ProtectedRoute`-guarded admin/create/edit pages
- **Auth** — JWT access/refresh tokens in `localStorage`; an Axios interceptor silently refreshes an expired access token and replays the failed request (`src/api/axiosClient.js`)
- **State** — Context providers for auth, theme, toasts and watchlist; custom hooks (`useAuth`, `useTheme`, `useToast`, `useWatchlist`, `usePageTitle`)
- **Browsing UX** — hero banner, genre rows with "See All" pages, live search, multi-genre filter pills, sorting, shuffle, "More like this", recently viewed, personal star ratings
- **Admin** — searchable catalog table with inline edit/delete and CSV export; shared create/edit form with validation and an unsaved-changes guard
- **Responsive design** — below 768px the navbar collapses into an accessible off-canvas sidebar; SCSS design tokens, dark/light themes
- **Polish** — skeleton loaders, poster fallback art, offline banner, back-to-top, skip-to-content link, scroll restoration

## Structure

```
src/
  api/          axios client (+ refresh interceptor), auth + movies endpoints
  components/   Navbar, Hero, MovieRow, MovieCard, Rating, Skeleton, Toast, ...
  context/      Auth, Theme, Toast, Watchlist providers
  hooks/        useAuth, useTheme, useToast, useWatchlist, usePageTitle
  pages/        Home, Genre, MovieDetail, MovieForm, MyList, Admin, Login, Signup, NotFound
  styles/       SCSS tokens, mixins, base
```

## Deploying (Vercel / Netlify)

Root directory `frontend`, build command `npm run build`, output `dist`, and set
`VITE_API_BASE_URL=https://<your-api>.onrender.com/api`. `vercel.json` and
`public/_redirects` already rewrite deep links to `index.html` so refreshing
on `/movies/5` works.
