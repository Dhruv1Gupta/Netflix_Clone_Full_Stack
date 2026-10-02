import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import './LanguageMenu.scss';

// A compact "EN ▾" dropdown for the navbar, and a plain inline variant for
// the footer (see `variant` prop) — both drive the same LanguageContext.
export default function LanguageMenu({ variant = 'nav' }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className={`language-menu language-menu--${variant}`} ref={ref}>
      <button
        type="button"
        className="language-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('nav.language')}
      >
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
          <path
            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 0c-1.9 2-3 4.6-3 8s1.1 6 3 8m0-16c1.9 2 3 4.6 3 8s-1.1 6-3 8M2.5 7h15M2.5 13h15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
        <span>{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <ul className="language-menu__list" role="listbox">
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === language}
                className={lang.code === language ? 'language-menu__item--active' : ''}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
              >
                <span className="language-menu__native">{lang.native}</span>
                <span className="language-menu__label">{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
