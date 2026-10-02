import { useRef } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../MovieCard/MovieCard';
import './MovieRow.scss';

export default function MovieRow({ title, movies, genre }) {
  const trackRef = useRef(null);

  function scrollBy(amount) {
    trackRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (!movies.length) return null;

  return (
    <section className="movie-row">
      <div className="movie-row__heading">
        <h2 className="movie-row__title">{title}</h2>
        {genre && (
          <Link to={`/genre/${genre}`} className="movie-row__see-all">
            See All &rarr;
          </Link>
        )}
      </div>
      <div className="movie-row__viewport">
        <button
          type="button"
          className="movie-row__nav movie-row__nav--prev"
          onClick={() => scrollBy(-600)}
          aria-label={`Scroll ${title} left`}
        >
          &#8249;
        </button>
        <div className="movie-row__track" ref={trackRef}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
        <button
          type="button"
          className="movie-row__nav movie-row__nav--next"
          onClick={() => scrollBy(600)}
          aria-label={`Scroll ${title} right`}
        >
          &#8250;
        </button>
      </div>
    </section>
  );
}
