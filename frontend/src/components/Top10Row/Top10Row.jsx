import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrending } from '../../api/movies';
import { useLanguage } from '../../hooks/useLanguage';
import './Top10Row.scss';

// Fetches the live Top 10 (see movies/views.py MovieViewSet.trending — ranked
// by in-app views, recomputed on every request) and renders it with the
// classic big-numeral treatment. Non-critical: renders nothing while
// loading or on failure rather than blocking the rest of the homepage.
export default function Top10Row() {
  const { t } = useLanguage();
  const [movies, setMovies] = useState(null); // null = loading/error, [] = empty

  useEffect(() => {
    let cancelled = false;
    getTrending()
      .then((data) => {
        if (!cancelled) setMovies(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setMovies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!movies || movies.length === 0) return null;

  return (
    <section className="top10-row" aria-label={t('top10.title')}>
      <div className="top10-row__head">
        <h2 className="top10-row__title">{t('top10.title')}</h2>
        <p className="top10-row__subtitle">{t('top10.subtitle')}</p>
      </div>
      <div className="top10-row__track">
        {movies.map((movie, i) => (
          <Link key={movie.id} to={`/movies/${movie.id}`} className="top10-card">
            <span className="top10-card__rank" aria-hidden="true">
              {i + 1}
            </span>
            <div className="top10-card__poster">
              {movie.poster_url ? (
                <img src={movie.poster_url} alt="" loading="lazy" />
              ) : (
                <div className={`top10-card__fallback top10-card__fallback--${movie.genre || 'drama'}`} />
              )}
            </div>
            <span className="top10-card__title">{movie.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
