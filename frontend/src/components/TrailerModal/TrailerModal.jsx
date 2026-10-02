import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../hooks/useLanguage';
import './TrailerModal.scss';

// Plays a movie's trailer via YouTube's privacy-enhanced embed
// (youtube-nocookie.com) — the video is served by YouTube/the rights
// holder's own channel; this component only picks which video id to embed.
// When a title has trailers in more than one language, a small tab strip
// lets the viewer switch between them.
//
// Rendered through a portal into document.body: MovieCard and Top10Row use
// this inside a clickable <Link>, and a portal keeps every click inside the
// modal (close button, language tabs) from bubbling through that anchor and
// triggering navigation — as well as escaping any ancestor's horizontal
// scroll/overflow clipping.
export default function TrailerModal({ open, title, trailers = [], onClose }) {
  const { t, language } = useLanguage();
  const dialogRef = useRef(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!open || trailers.length === 0) return;
    // Prefer the current UI language's trailer, then English, then whatever's first.
    const preferred =
      trailers.find((tr) => tr.language === language) ||
      trailers.find((tr) => tr.language === 'en') ||
      trailers[0];
    setActiveId(preferred.id);
  }, [open, trailers, language]);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || trailers.length === 0) return null;

  const active = trailers.find((tr) => tr.id === activeId) || trailers[0];

  return createPortal(
    <div className="trailer-modal__backdrop" onMouseDown={onClose}>
      <div
        className="trailer-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('trailer.modalTitle', { title })}
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="trailer-modal__head">
          <h2 className="trailer-modal__title">{t('trailer.modalTitle', { title })}</h2>
          <button
            type="button"
            className="trailer-modal__close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={t('trailer.close')}
          >
            &times;
          </button>
        </div>

        {trailers.length > 1 && (
          <div className="trailer-modal__tabs" role="tablist">
            {trailers.map((tr) => (
              <button
                key={tr.id}
                type="button"
                role="tab"
                aria-selected={tr.id === active.id}
                className={`trailer-modal__tab ${tr.id === active.id ? 'trailer-modal__tab--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(tr.id);
                }}
              >
                {tr.label || tr.language_label}
              </button>
            ))}
          </div>
        )}

        <div className="trailer-modal__player">
          <iframe
            key={active.youtube_id}
            src={`https://www.youtube-nocookie.com/embed/${active.youtube_id}?autoplay=1&rel=0`}
            title={t('trailer.modalTitle', { title })}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
