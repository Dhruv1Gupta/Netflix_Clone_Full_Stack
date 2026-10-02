import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteMovie, listMovies, GENRE_LABELS } from "../../api/movies";
import { useToast } from "../../hooks/useToast";
import { usePageTitle } from "../../hooks/usePageTitle";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import "./AdminMovies.scss";

export default function AdminMovies() {
  usePageTitle("Manage Movies");
  const { notify } = useToast();
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // movie object or null
  const [deleting, setDeleting] = useState(false);

  function load() {
    setStatus("loading");
    listMovies()
      .then((data) => {
        setMovies(Array.isArray(data) ? data : data.results || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, []);

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function csvEscape(value) {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  function handleExportCsv() {
    const headers = [
      "id",
      "title",
      "genre",
      "release_year",
      "is_featured",
      "poster_url",
      "description",
    ];
    const rows = filtered.map((m) =>
      headers.map((h) => csvEscape(m[h])).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netflix-movies-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(
      `Exported ${filtered.length} movie${filtered.length === 1 ? "" : "s"} to CSV.`,
      { type: "success" },
    );
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteMovie(pendingDelete.id);
      setMovies((prev) => prev.filter((m) => m.id !== pendingDelete.id));
      notify(`"${pendingDelete.title}" was deleted.`, { type: "success" });
    } catch {
      notify("Could not delete this movie. Please try again.", {
        type: "error",
      });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="page">
        <Loader label="Loading catalog…" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page">
        <EmptyState
          title="Couldn't load the catalog"
          description="The API may be waking up from a cold start. Try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Manage Movies</h1>
          <p className="admin-page__subtitle">
            {movies.length} title{movies.length === 1 ? "" : "s"} in the
            catalog.
          </p>
        </div>
        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-page__export-btn"
            onClick={handleExportCsv}
            disabled={!filtered.length}
          >
            Export CSV
          </button>
          <Link to="/movies/new" className="admin-page__add-btn">
            + Add Movie
          </Link>
        </div>
      </div>

      <input
        type="search"
        className="admin-page__search"
        placeholder="Filter by title…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Filter by title"
      />

      {filtered.length ? (
        <div className="admin-table__wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Genre</th>
                <th>Year</th>
                <th>Featured</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((movie) => (
                <tr key={movie.id}>
                  <td className="admin-table__thumb-cell">
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt=""
                        className="admin-table__thumb"
                      />
                    ) : (
                      <div className="admin-table__thumb admin-table__thumb--blank" />
                    )}
                  </td>
                  <td>
                    <Link
                      to={`/movies/${movie.id}`}
                      className="admin-table__title-link"
                    >
                      {movie.title}
                    </Link>
                  </td>
                  <td>{GENRE_LABELS[movie.genre] || movie.genre}</td>
                  <td>{movie.release_year}</td>
                  <td>
                    {movie.is_featured ? (
                      <span className="admin-table__yes">Yes</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="admin-table__actions">
                    <Link
                      to={`/movies/${movie.id}/edit`}
                      className="admin-table__btn"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="admin-table__btn admin-table__btn--danger"
                      onClick={() => setPendingDelete(movie)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No matches"
          description="Try a different search term."
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this movie?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
