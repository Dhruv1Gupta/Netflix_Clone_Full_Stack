import './Skeleton.scss';

// Renders `count` shimmering poster-shaped placeholders, optionally
// grouped into `rows` fake genre rows so the loading state matches
// the real Home layout instead of a generic spinner.
export default function SkeletonRows({ rows = 3, cardsPerRow = 6 }) {
  return (
    <div className="skeleton-rows" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div className="skeleton-row" key={rowIdx}>
          <div className="skeleton skeleton--title" />
          <div className="skeleton-row__cards">
            {Array.from({ length: cardsPerRow }).map((__, cardIdx) => (
              <div className="skeleton skeleton--poster" key={cardIdx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
