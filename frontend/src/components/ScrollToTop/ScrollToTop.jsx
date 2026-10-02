import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position between route changes like a
// traditional multi-page site would. Without this, navigating from the
// bottom of a long genre row straight to a movie's detail page would leave
// you scrolled halfway down the new page too.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
