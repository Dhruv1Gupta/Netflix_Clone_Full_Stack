import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GENRE_LABELS } from '../../api/movies';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useLanguage } from '../../hooks/useLanguage';
import TrailerModal from '../TrailerModal/TrailerModal';
import './MovieCard.scss';

export default function MovieCard({ movie }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { has, toggle } = useWatchlist();
  const { t } = useLanguage();
  const inWatchlist = has(movie.id);
  const showImage = movie.poster_url && !imgFailed;
  const genreClass = `movie-card__fallback--${movie.genre || 'drama'}`;
  const hasTrailer = movie.trailers?.length > 0;

  function handleWatchlistClick(e) {
    e.preventDefault(); // don't navigate to the detail page
    e.stopPropagation();
    toggle(movie.id);
  }

  function handleTrailerClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setTrailerOpen(true);
  }

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-card__poster">
        {showImage ? (
          <img
            src={movie.poster_url}
            alt={`${movie.title} poster`}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={`movie-card__fallback ${genreClass}`}>
            <span className="movie-card__fallback-title">{movie.title}</span>
          </div>
        )}
        {movie.is_featured && <span className="movie-card__badge">Featured</span>}

        {hasTrailer && (
          <button
            type="button"
            className="movie-card__trailer-btn"
            onClick={handleTrailerClick}
            aria-label={t('trailer.play')}
            title={t('trailer.play')}
          >
            ▶
          </button>
        )}

        <button
          type="button"
          className={`movie-card__watch-btn ${inWatchlist ? 'movie-card__watch-btn--active' : ''}`}
          onClick={handleWatchlistClick}
          aria-pressed={inWatchlist}
          aria-label={inWatchlist ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`}
        >
          {inWatchlist ? '✓' : '+'}
        </button>

        <div className="movie-card__overlay">
          <span className="movie-card__overlay-title">{movie.title}</span>
          <span className="movie-card__overlay-meta">
            {movie.release_year} · {GENRE_LABELS[movie.genre] || movie.genre}
          </span>
        </div>
      </div>

      {hasTrailer && (
        <TrailerModal
          open={trailerOpen}
          title={movie.title}
          trailers={movie.trailers}
          onClose={() => setTrailerOpen(false)}
        />
      )}
    </Link>
  );
}
