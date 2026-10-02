import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMovies } from '../../api/movies';
import { useWatchlist } from '../../hooks/useWatchlist';
import { usePageTitle } from '../../hooks/usePageTitle';
import MovieCard from '../../components/MovieCard/MovieCard';
import SkeletonRows from '../../components/Skeleton/SkeletonRows';
import EmptyState from '../../components/EmptyState/EmptyState';
import '../Home/Home.scss';
import './MyList.scss';

export default function MyList() {
  usePageTitle('My List');
  const { ids } = useWatchlist();
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
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

  const watchlistMovies = useMemo(
    () => movies.filter((m) => ids.includes(m.id)),
    [movies, ids]
  );

  if (status === 'loading') {
    return <SkeletonRows rows={1} cardsPerRow={6} />;
  }

  return (
    <div className="page my-list-page">
      <h1 className="my-list__title">My List</h1>
      <p className="my-list__subtitle">
        Saved on this browser only — tap the <span>+</span> on any poster to add or remove a title.
      </p>

      {status === 'error' ? (
        <EmptyState
          title="Couldn't load your list"
          description="The API may be waking up from a cold start. Try again in a moment."
        />
      ) : watchlistMovies.length ? (
        <div className="home__grid">
          {watchlistMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your list is empty"
          description="Browse the catalog and tap the + on any title to save it here."
          action={
            <Link to="/" className="movie-detail__back-link">
              Browse movies
            </Link>
          }
        />
      )}
    </div>
  );
}
