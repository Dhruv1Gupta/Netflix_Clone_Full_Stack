import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";
import LanguageMenu from "../LanguageMenu/LanguageMenu";
import "./Navbar.scss";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // desktop avatar dropdown
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close the mobile sidebar automatically whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Lock background scroll while the sidebar is open.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Escape closes the sidebar; "/" jumps focus into search (a la GitHub).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : "/");
    setSidebarOpen(false);
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    setSidebarOpen(false);
    navigate("/");
  }

  const navLinks = (
    <>
      <Link to="/">{t("nav.browse")}</Link>
      <Link to="/my-list">{t("nav.myList")}</Link>
      {isAuthenticated && <Link to="/movies/new">{t("nav.addMovie")}</Link>}
      {isAuthenticated && <Link to="/admin">{t("nav.manage")}</Link>}
    </>
  );

  const ThemeIcon = () =>
    theme === "dark" ? (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path
          d="M10 3.5v1.5M10 15v1.5M16.5 10H15M5 10H3.5M14.6 5.4l-1 1M6.4 13.6l-1 1M14.6 14.6l-1-1M6.4 6.4l-1-1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="10" cy="10" r="3.5" fill="currentColor" />
      </svg>
    ) : (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path
          d="M16 12.4A6.5 6.5 0 0 1 7.6 4a6.5 6.5 0 1 0 8.4 8.4Z"
          fill="currentColor"
        />
      </svg>
    );

  return (
    <>
      <header className={`navbar ${scrolled ? "navbar--solid" : ""}`}>
        <div className="navbar__inner">
          <button
            type="button"
            className="navbar__hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="navbar-sidebar"
          >
            <span />
            <span />
            <span />
          </button>

          <Link to="/" className="navbar__brand" aria-label="NETFLIX home">
            <svg
              viewBox="0 0 64 64"
              className="navbar__mark"
              aria-hidden="true"
            >
              <path
                d="M12 6 L12 58 L21 58 L21 28 L36 58 L46 58 L46 6 L37 6 L37 34 L21 6 Z"
                fill="currentColor"
              />
            </svg>
            <span className="navbar__wordmark">NETFLIX</span>
          </Link>

          <nav className="navbar__links" aria-label="Primary">
            {navLinks}
          </nav>

          <form
            className="navbar__search"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              aria-label="Search titles"
            />
            <button type="submit" aria-label="Search">
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path
                  d="M13.5 12.5 L18 17 M9 15a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>

          <LanguageMenu variant="nav" />

          <button
            type="button"
            className="navbar__theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
          >
            <ThemeIcon />
          </button>

          <div className="navbar__auth" ref={menuRef}>
            {isAuthenticated ? (
              <div className="navbar__user">
                <button
                  type="button"
                  className="navbar__avatar"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {(user?.email || "?").charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="navbar__menu" role="menu">
                    <span className="navbar__menu-email">{user?.email}</span>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      {t("nav.signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="navbar__signin">
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar: hamburger opens this off-canvas panel below the `md` breakpoint. */}
      <div
        className={`navbar-sidebar ${sidebarOpen ? "navbar-sidebar--open" : ""}`}
        id="navbar-sidebar"
      >
        <div
          className="navbar-sidebar__backdrop"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className="navbar-sidebar__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="navbar-sidebar__header">
            <span className="navbar__wordmark">NETFLIX</span>
            <button
              type="button"
              className="navbar-sidebar__close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              &times;
            </button>
          </div>

          <form
            className="navbar-sidebar__search"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              aria-label="Search titles"
            />
          </form>

          <nav className="navbar-sidebar__links" aria-label="Primary">
            {navLinks}
          </nav>

          <div className="navbar-sidebar__footer">
            <LanguageMenu variant="nav" />

            <button
              type="button"
              className="navbar-sidebar__theme"
              onClick={toggleTheme}
            >
              <ThemeIcon />
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>

            {isAuthenticated ? (
              <>
                <span className="navbar-sidebar__email">{user?.email}</span>
                <button
                  type="button"
                  className="navbar-sidebar__signout"
                  onClick={handleLogout}
                >
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="navbar-sidebar__signin"
                onClick={() => setSidebarOpen(false)}
              >
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
