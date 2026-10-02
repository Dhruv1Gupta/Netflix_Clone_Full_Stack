import { createContext, useCallback, useMemo, useState } from 'react';
import { getWatchlist, toggleWatchlist as toggleStored } from '../utils/localFeatures';

export const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState(() => getWatchlist());

  const toggle = useCallback((movieId) => {
    setIds(toggleStored(movieId));
  }, []);

  const has = useCallback((movieId) => ids.includes(movieId), [ids]);

  const value = useMemo(() => ({ ids, toggle, has }), [ids, toggle, has]);

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}
