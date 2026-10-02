import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addTrailer, createMovie, deleteTrailer, getMovie, GENRES, GENRE_LABELS, updateMovie } from '../../api/movies';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLanguage } from '../../hooks/useLanguage';
import { TRAILER_LANGUAGE_OPTIONS } from '../../utils/trailerLanguages';
import Loader from '../../components/Loader/Loader';
import './MovieForm.scss';

const EMPTY_FORM = {
  title: '',
  description: '',
  genre: GENRES[0],
  release_year: new Date().getFullYear(),
  poster_url: '',
  is_featured: false,
};

export default function MovieForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { t } = useLanguage();

  usePageTitle(isEdit ? 'Edit Movie' : 'Add Movie');

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [dirty, setDirty] = useState(false);

  // Trailer management (edit mode only — a trailer belongs to an existing
  // movie id). Kept independent of the main form's submit/dirty state:
  // each add/delete here calls the API immediately rather than waiting for
  // "Save Changes".
  const [trailers, setTrailers] = useState([]);
  const [newTrailer, setNewTrailer] = useState({ language: 'en', youtube_id: '', label: '' });
  const [trailerSaving, setTrailerSaving] = useState(false);
  const [trailerError, setTrailerError] = useState('');

  // Warn on an actual tab close/refresh with unsaved changes. This can only
  // guard the browser-level unload event (not in-app SPA navigation, which
  // would need a router data-mode setup this project doesn't use), but it
  // still saves someone from losing a half-filled form to a stray Cmd+R.
  useEffect(() => {
    function onBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    getMovie(id)
      .then((movie) => {
        if (cancelled) return;
        setForm({
          title: movie.title || '',
          description: movie.description || '',
          genre: movie.genre || GENRES[0],
          release_year: movie.release_year || new Date().getFullYear(),
          poster_url: movie.poster_url || '',
          is_featured: Boolean(movie.is_featured),
        });
        setTrailers(movie.trailers || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFormError('Could not load this movie for editing.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setDirty(true);
  }

  async function handleAddTrailer(e) {
    e.preventDefault();
    if (!newTrailer.youtube_id.trim()) return;
    setTrailerSaving(true);
    setTrailerError('');
    try {
      const saved = await addTrailer(id, newTrailer);
      // Adding again in the same language replaces it server-side too.
      setTrailers((prev) => [...prev.filter((tr) => tr.language !== saved.language), saved]);
      setNewTrailer({ language: 'en', youtube_id: '', label: '' });
    } catch (err) {
      const data = err.response?.data;
      const message =
        (typeof data === 'object' && (data.youtube_id?.[0] || data.language?.[0])) ||
        'Could not add this trailer. Check the link and try again.';
      setTrailerError(message);
    } finally {
      setTrailerSaving(false);
    }
  }

  async function handleDeleteTrailer(trailerId) {
    setTrailers((prev) => prev.filter((tr) => tr.id !== trailerId)); // optimistic
    try {
      await deleteTrailer(id, trailerId);
    } catch {
      notify('Could not remove that trailer. Reloading the current list.', { type: 'error' });
      getMovie(id).then((movie) => setTrailers(movie.trailers || []));
    }
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    if (!form.genre) next.genre = 'Genre is required.';
    const year = Number(form.release_year);
    if (!year || year < 1888 || year > new Date().getFullYear() + 5) {
      next.release_year = 'Enter a valid release year.';
    }
    if (form.poster_url && !/^https?:\/\//i.test(form.poster_url.trim())) {
      next.poster_url = 'Poster URL should start with http:// or https://';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      genre: form.genre,
      release_year: Number(form.release_year),
      poster_url: form.poster_url.trim(),
      is_featured: form.is_featured,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateMovie(id, payload);
        notify('Movie updated.', { type: 'success' });
        setDirty(false);
        navigate(`/movies/${id}`);
      } else {
        const created = await createMovie(payload);
        notify('Movie added to the catalog.', { type: 'success' });
        setDirty(false);
        navigate(`/movies/${created.id}`);
      }
    } catch (err) {
      setSubmitting(false);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setFormError('Your session has expired. Please sign in again.');
        return;
      }
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors((prev) => ({ ...prev, ...data }));
      }
      setFormError('Could not save this movie. Check the fields below and try again.');
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Loader label="Loading movie…" />
      </div>
    );
  }

  return (
    <div className="page movie-form-page">
      <h1 className="movie-form__title">{isEdit ? 'Edit Movie' : 'Add Movie'}</h1>
      <p className="movie-form__subtitle">
        {isEdit
          ? 'Update the details below — all fields are sent as a full replace.'
          : 'Add a new title to the catalog. It will appear under its genre row on Browse.'}
      </p>

      <form className="movie-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="movie-form__error" role="alert">
            {formError}
          </p>
        )}

        <div className={`movie-form__field ${errors.title ? 'movie-form__field--error' : ''}`}>
          <label htmlFor="mf-title">Title</label>
          <input
            id="mf-title"
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Inception"
          />
          {errors.title && <span className="movie-form__hint">{errors.title}</span>}
        </div>

        <div className={`movie-form__field ${errors.description ? 'movie-form__field--error' : ''}`}>
          <label htmlFor="mf-description">Description</label>
          <textarea
            id="mf-description"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="A short synopsis of the movie."
          />
          {errors.description && <span className="movie-form__hint">{errors.description}</span>}
        </div>

        <div className="movie-form__row">
          <div className={`movie-form__field ${errors.genre ? 'movie-form__field--error' : ''}`}>
            <label htmlFor="mf-genre">Genre</label>
            <select id="mf-genre" value={form.genre} onChange={(e) => update('genre', e.target.value)}>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {GENRE_LABELS[g]}
                </option>
              ))}
            </select>
            {errors.genre && <span className="movie-form__hint">{errors.genre}</span>}
          </div>

          <div className={`movie-form__field ${errors.release_year ? 'movie-form__field--error' : ''}`}>
            <label htmlFor="mf-year">Release year</label>
            <input
              id="mf-year"
              type="number"
              value={form.release_year}
              onChange={(e) => update('release_year', e.target.value)}
              min="1888"
              max={new Date().getFullYear() + 5}
            />
            {errors.release_year && <span className="movie-form__hint">{errors.release_year}</span>}
          </div>
        </div>

        <div className={`movie-form__field ${errors.poster_url ? 'movie-form__field--error' : ''}`}>
          <label htmlFor="mf-poster">Poster URL (optional)</label>
          <input
            id="mf-poster"
            type="text"
            value={form.poster_url}
            onChange={(e) => update('poster_url', e.target.value)}
            placeholder="https://example.com/poster.jpg"
          />
          {errors.poster_url && <span className="movie-form__hint">{errors.poster_url}</span>}
          {!errors.poster_url && (
            <span className="movie-form__hint movie-form__hint--muted">
              Leave blank to show a generated genre-colored poster instead.
            </span>
          )}
        </div>

        <label className="movie-form__checkbox">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => update('is_featured', e.target.checked)}
          />
          Feature this movie in the homepage hero banner
        </label>

        <div className="movie-form__actions">
          <button
            type="button"
            className="movie-form__btn movie-form__btn--ghost"
            onClick={() => {
              if (dirty && !window.confirm('Discard your unsaved changes?')) return;
              navigate(-1);
            }}
          >
            Cancel
          </button>
          <button type="submit" className="movie-form__btn movie-form__btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Movie'}
          </button>
        </div>
      </form>

      {isEdit && (
        <section className="movie-form__trailers" aria-label="Trailers">
          <h2 className="movie-form__trailers-title">Trailers</h2>
          <p className="movie-form__trailers-hint">
            Paste a YouTube link (or its 11-character video id) per language. Viewers see a{' '}
            {t('trailer.play')} button and, when more than one language is attached, tabs to switch between
            them.
          </p>

          {trailers.length > 0 && (
            <ul className="movie-form__trailer-list">
              {trailers.map((tr) => (
                <li key={tr.id}>
                  <span className="movie-form__trailer-lang">{tr.language_label}</span>
                  <span className="movie-form__trailer-id">{tr.youtube_id}</span>
                  {tr.label && <span className="movie-form__trailer-label">{tr.label}</span>}
                  <button
                    type="button"
                    className="movie-form__trailer-remove"
                    onClick={() => handleDeleteTrailer(tr.id)}
                    aria-label={`Remove ${tr.language_label} trailer`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="movie-form__trailer-add" onSubmit={handleAddTrailer}>
            {trailerError && (
              <p className="movie-form__error" role="alert">
                {trailerError}
              </p>
            )}
            <div className="movie-form__trailer-add-row">
              <select
                value={newTrailer.language}
                onChange={(e) => setNewTrailer((prev) => ({ ...prev, language: e.target.value }))}
                aria-label="Trailer language"
              >
                {TRAILER_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newTrailer.youtube_id}
                onChange={(e) => setNewTrailer((prev) => ({ ...prev, youtube_id: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=…"
                aria-label="YouTube link or video id"
              />
              <input
                type="text"
                value={newTrailer.label}
                onChange={(e) => setNewTrailer((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Label (optional)"
                aria-label="Trailer label"
              />
              <button type="submit" className="movie-form__btn movie-form__btn--ghost" disabled={trailerSaving}>
                {trailerSaving ? 'Adding…' : 'Add Trailer'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
