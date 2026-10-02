import { Link } from 'react-router-dom';
import { GENRE_LABELS } from '../../api/movies';
import './Hero.scss';

export default function Hero({ movie }) {
  if (!movie) return null;

  return (
    <section className="hero">
      <div className="hero__backdrop">
        {movie.poster_url && (
          <img src={movie.poster_url} alt="" aria-hidden="true" />
        )}
        <div className="hero__scrim" />
      </div>

      <div className="hero__content">
        <span className="hero__eyebrow">Featured</span>
        <h1 className="hero__title">{movie.title}</h1>
        <div className="hero__meta">
          <span>{movie.release_year}</span>
          <span className="hero__dot">&bull;</span>
          <span>{GENRE_LABELS[movie.genre] || movie.genre}</span>
        </div>
        <p className="hero__description">{movie.description}</p>
        <div className="hero__actions">
          <Link to={`/movies/${movie.id}`} className="hero__btn hero__btn--primary">
            More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
