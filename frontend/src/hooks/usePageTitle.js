import { useEffect } from 'react';

const SITE_NAME = 'NETFLIX';

// Keeps the browser tab / history entry meaningful as you move around the
// SPA (movie titles in the tab, bookmarks that read as something other
// than "NETFLIX" for every single page).
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = SITE_NAME;
    };
  }, [title]);
}
