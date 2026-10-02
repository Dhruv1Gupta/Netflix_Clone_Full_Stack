import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listMovies, GENRES, GENRE_LABELS } from '../../api/movies';
import { getRecentlyViewed } from '../../utils/localFeatures';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import Hero from '../../components/Hero/Hero';
import MovieRow from '../../components/MovieRow/MovieRow';
import MovieCard from '../../components/MovieCard/MovieCard';
import Top10Row from '../../components/Top10Row/Top10Row';
import ReasonsToJoin from '../../components/ReasonsToJoin/ReasonsToJoin';
import SkeletonRows from '../../components/Skeleton/SkeletonRows';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Home.scss';

const SORT_OPTIONS = [
  { value: 'default', label: 'Suggested' },
  { value: 'year-desc', label: 'Newest first' },
  { value: 'year-asc', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
];

function sortMovies(list, sortBy) {
  const copy = [...list];
  switch (sortBy) {
    case 'year-desc':
      return copy.sort((a, b) => b.release_year - a.release_year);
    case 'year-asc':
      return copy.sort((a, b) => a.release_year - b.release_year);
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return copy;
  }
}

export default function Home() {
  usePageTitle('NETFLIX Clone');
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [activeGenres, setActiveGenres] = useState([]); // [] = all genres
  const [sortBy, setSortBy] = useState('default');
  const [searchParams] = useSearchParams();
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const navigate = useNavigate();
  const { ids: watchlistIds } = useWatchlist();
  const { isAuthenticated } = useAuth();
  const [recentIds] = useState(() => getRecentlyViewed());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    listMovies()
      .then((data) => {
        if (cancelled) return;
        setMovies(Array.isArray(data) ? data : data.results || []);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleGenre(genre) {
    setActiveGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  function clearFilters() {
    setActiveGenres([]);
    setSortBy('default');
  }

  const filtersActive = activeGenres.length > 0 || sortBy !== 'default';
  const showGrid = Boolean(search) || filtersActive;

  const filteredMovies = useMemo(() => {
    let list = movies;

    if (search) {
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(search) ||
          m.description?.toLowerCase().includes(search) ||
          m.genre?.toLowerCase().includes(search)
      );
    }

    if (activeGenres.length) {
      list = list.filter((m) => activeGenres.includes(m.genre));
    }

    return sortMovies(list, sortBy);
  }, [movies, search, activeGenres, sortBy]);

  const featured = useMemo(() => movies.find((m) => m.is_featured) || movies[0], [movies]);

  const watchlistMovies = useMemo(
    () => movies.filter((m) => watchlistIds.includes(m.id)),
    [movies, watchlistIds]
  );

  const recentlyViewedMovies = useMemo(() => {
    const byId = new Map(movies.map((m) => [m.id, m]));
    return recentIds.map((id) => byId.get(id)).filter(Boolean);
  }, [movies, recentIds]);

  const newReleases = useMemo(
    () => [...movies].sort((a, b) => b.release_year - a.release_year).slice(0, 10),
    [movies]
  );

  const genreRows = useMemo(() => {
    return GENRES.map((genre) => ({
      genre,
      label: GENRE_LABELS[genre],
      movies: movies.filter((m) => m.genre === genre),
    })).filter((row) => row.movies.length > 0);
  }, [movies]);

  function handleShuffle() {
    if (!movies.length) return;
    const pick = movies[Math.floor(Math.random() * movies.length)];
    navigate(`/movies/${pick.id}`);
  }

  if (status === 'loading') {
    return <SkeletonRows rows={3} cardsPerRow={6} />;
  }

  if (status === 'error') {
    return (
      <div className="page">
        <EmptyState
          title="Couldn't reach the server"
          description="The API may be waking up from a cold start (the free tier sleeps after 15 minutes idle) — this can take 20–30 seconds on the first request. Try again in a moment."
        />
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="page">
        <EmptyState title="No movies yet" description="Sign in and add the first title to the catalog." />
      </div>
    );
  }

  return (
    <div className="home">
      {!search && <Hero movie={featured} />}

      <div className={`home__toolbar ${search ? 'home__toolbar--search' : ''}`}>
        <div className="home__toolbar-inner">
          <div className="home__genre-pills">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`home__pill ${activeGenres.includes(genre) ? 'home__pill--active' : ''}`}
                onClick={() => toggleGenre(genre)}
                aria-pressed={activeGenres.includes(genre)}
              >
                {GENRE_LABELS[genre]}
              </button>
            ))}
          </div>

          <div className="home__toolbar-actions">
            <select
              className="home__sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort movies"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {filtersActive && (
              <button type="button" className="home__clear" onClick={clearFilters}>
                Clear
              </button>
            )}

            <button type="button" className="home__shuffle" onClick={handleShuffle}>
              🔀 Shuffle
            </button>
          </div>
        </div>
      </div>

      {showGrid ? (
        <div className="page home--search">
          {search && (
            <h1 className="home__search-title">
              {filteredMovies.length} result{filteredMovies.length === 1 ? '' : 's'} for “
              {searchParams.get('search')}”
            </h1>
          )}
          {filteredMovies.length ? (
            <div className="home__grid">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <EmptyState title="No matches" description="Try a different title, genre, or keyword." />
          )}
        </div>
      ) : (
        <div className="home__rows">
          <Top10Row />
          {newReleases.length > 0 && <MovieRow title="New Releases" movies={newReleases} />}
          {watchlistMovies.length > 0 && <MovieRow title="My List" movies={watchlistMovies} />}
          {recentlyViewedMovies.length > 0 && (
            <MovieRow title="Recently Viewed" movies={recentlyViewedMovies} />
          )}
          {genreRows.map((row) => (
            <MovieRow key={row.genre} title={row.label} movies={row.movies} genre={row.genre} />
          ))}
        </div>
      )}

      {!isAuthenticated && <ReasonsToJoin />}
    </div>
  );
}
