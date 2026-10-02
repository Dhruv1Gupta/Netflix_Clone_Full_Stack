import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listMovies, GENRE_LABELS, GENRES } from '../../api/movies';
import { usePageTitle } from '../../hooks/usePageTitle';
import MovieCard from '../../components/MovieCard/MovieCard';
import SkeletonRows from '../../components/Skeleton/SkeletonRows';
import EmptyState from '../../components/EmptyState/EmptyState';
import '../Home/Home.scss';
import './GenreView.scss';

const SORT_OPTIONS = [
  { value: 'default', label: 'Suggested' },
  { value: 'year-desc', label: 'Newest first' },
  { value: 'year-asc', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title A–Z' },
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
    default:
      return copy;
  }
}

export default function GenreView() {
  const { genre } = useParams();
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading');
  const [sortBy, setSortBy] = useState('default');

  const label = GENRE_LABELS[genre] || genre;
  usePageTitle(GENRES.includes(genre) ? label : 'Genre not found');

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
  }, [genre]);

  const genreMovies = useMemo(
    () => sortMovies(movies.filter((m) => m.genre === genre), sortBy),
    [movies, genre, sortBy]
  );

  if (!GENRES.includes(genre)) {
    return (
      <div className="page">
        <EmptyState
          title="Unknown genre"
          description={`"${genre}" isn't one of the catalog's genres.`}
          action={
            <Link to="/" className="movie-detail__back-link">
              Back to Browse
            </Link>
          }
        />
      </div>
    );
  }

  if (status === 'loading') {
    return <SkeletonRows rows={1} cardsPerRow={6} />;
  }

  if (status === 'error') {
    return (
      <div className="page">
        <EmptyState
          title="Couldn't reach the server"
          description="The API may be waking up from a cold start. Try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="page home--search">
      <div className="genre-view__header">
        <h1 className="home__search-title">{label}</h1>
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
      </div>

      {genreMovies.length ? (
        <div className="home__grid">
          {genreMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <EmptyState title="No titles yet" description={`No ${label.toLowerCase()} movies in the catalog yet.`} />
      )}
    </div>
  );
}
