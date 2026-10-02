import { useState } from 'react';
import { getRating, setRating as persistRating } from '../../utils/localFeatures';
import './Rating.scss';

const STARS = [1, 2, 3, 4, 5];

export default function Rating({ movieId }) {
  const [value, setValue] = useState(() => getRating(movieId));
  const [hovered, setHovered] = useState(0);

  function handleRate(star) {
    const next = value === star ? 0 : star; // click the same star again to clear
    setValue(next);
    persistRating(movieId, next);
  }

  return (
    <div className="rating" role="radiogroup" aria-label="Your rating">
      <div className="rating__stars" onMouseLeave={() => setHovered(0)}>
        {STARS.map((star) => {
          const filled = hovered ? star <= hovered : star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              className={`rating__star ${filled ? 'rating__star--filled' : ''}`}
              onMouseEnter={() => setHovered(star)}
              onClick={() => handleRate(star)}
            >
              ★
            </button>
          );
        })}
      </div>
      <span className="rating__label">
        {value ? `Your rating: ${value}/5` : 'Rate this title'}
      </span>
    </div>
  );
}
