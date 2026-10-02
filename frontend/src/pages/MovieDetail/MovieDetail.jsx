import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteMovie, getMovie, listMovies, GENRE_LABELS } from '../../api/movies';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useWatchlist } from '../../hooks/useWatchlist';
import { usePageTitle } from '../../hooks/usePageTitle';
import { pushRecentlyViewed } from '../../utils/localFeatures';
import Loader from '../../components/Loader/Loader';
import EmptyState from '../../components/EmptyState/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import TrailerModal from '../../components/TrailerModal/TrailerModal';
import Rating from '../../components/Rating/Rating';
import MovieRow from '../../components/MovieRow/MovieRow';
import { useLanguage } from '../../hooks/useLanguage';
import './MovieDetail.scss';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();
  const { has, toggle } = useWatchlist();
  const { t } = useLanguage();

  const [movie, setMovie] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [imgFailed, setImgFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [related, setRelated] = useState([]);
  const [trailerOpen, setTrailerOpen] = useState(false);

  usePageTitle(movie?.title);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setImgFailed(false);

    getMovie(id)
      .then((data) => {
        if (cancelled) return;
        setMovie(data);
        setStatus('ready');
        // Record this title as recently viewed for the homepage row.
        pushRecentlyViewed(data.id);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? 'notfound' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // "More Like This" — same genre, current title excluded. A light extra
  // fetch of the whole catalog; fine at this dataset size and keeps
  // getMovie() itself untouched for the primary render path.
  useEffect(() => {
    let cancelled = false;
    listMovies()
      .then((data) => {
        if (cancelled) return;
        setRelated(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {
        /* non-critical — the row just won't render */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const moreLikeThis = useMemo(() => {
    if (!movie) return [];
    return related.filter((m) => m.genre === movie.genre && m.id !== movie.id).slice(0, 10);
  }, [related, movie]);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      notify('Link copied to clipboard.', { type: 'success' });
    } catch {
      notify(url, { type: 'info', duration: 6000 });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMovie(id);
      notify(`"${movie.title}" was deleted.`, { type: 'success' });
      navigate('/', { replace: true });
    } catch (err) {
      setDeleting(false);
      setConfirmOpen(false);
      const message =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please sign in again.'
          : 'Could not delete this movie. Please try again.';
      notify(message, { type: 'error' });
    }
  }

  if (status === 'loading') {
    return (
      <div className="page">
        <Loader label="Loading title…" />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="page movie-detail-page">
        <EmptyState
          title="Movie not found"
          description="This title may have been removed, or the demo database reset on a recent deploy."
          action={
            <Link to="/" className="movie-detail__back-link">
              Back to Browse
            </Link>
          }
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page movie-detail-page">
        <EmptyState
          title="Couldn't load this title"
          description="The API may be waking up from a cold start. Try again in a moment."
        />
      </div>
    );
  }

  const showImage = movie.poster_url && !imgFailed;

  return (
    <div className="movie-detail-page">
      <div className="movie-detail">
        <div className="movie-detail__poster">
          {showImage ? (
            <img src={movie.poster_url} alt={`${movie.title} poster`} onError={() => setImgFailed(true)} />
          ) : (
            <div className={`movie-detail__fallback movie-detail__fallback--${movie.genre || 'drama'}`}>
              <span>{movie.title}</span>
            </div>
          )}
        </div>

        <div className="movie-detail__info">
          {movie.is_featured && <span className="movie-detail__badge">Featured</span>}
          <h1 className="movie-detail__title">{movie.title}</h1>
          <div className="movie-detail__meta">
            <span>{movie.release_year}</span>
            <span className="movie-detail__dot">&bull;</span>
            <span>{GENRE_LABELS[movie.genre] || movie.genre}</span>
          </div>
          <p className="movie-detail__description">{movie.description}</p>

          <div className="movie-detail__rating-row">
            <Rating movieId={movie.id} />
          </div>

          <div className="movie-detail__actions">
            {movie.trailers?.length > 0 && (
              <button
                type="button"
                className="movie-detail__btn movie-detail__btn--primary"
                onClick={() => setTrailerOpen(true)}
              >
                {t('trailer.play')}
              </button>
            )}
            <button
              type="button"
              className={`movie-detail__btn ${has(movie.id) ? 'movie-detail__btn--primary' : 'movie-detail__btn--ghost'}`}
              onClick={() => toggle(movie.id)}
            >
              {has(movie.id) ? '✓ In My List' : '+ My List'}
            </button>
            <button type="button" className="movie-detail__btn movie-detail__btn--ghost" onClick={handleShare}>
              Share
            </button>
            {isAuthenticated && (
              <>
                <Link to={`/movies/${movie.id}/edit`} className="movie-detail__btn movie-detail__btn--primary">
                  Edit
                </Link>
                <button
                  type="button"
                  className="movie-detail__btn movie-detail__btn--danger"
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </button>
              </>
            )}
          </div>

          <Link to="/" className="movie-detail__back-link">
            &larr; Back to Browse
          </Link>
        </div>
      </div>

      {moreLikeThis.length > 0 && (
        <div className="movie-detail__related">
          <MovieRow title="More Like This" movies={moreLikeThis} />
        </div>
      )}

      <TrailerModal
        open={trailerOpen}
        title={movie.title}
        trailers={movie.trailers || []}
        onClose={() => setTrailerOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this movie?"
        description={`"${movie.title}" will be permanently removed from the catalog. This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
