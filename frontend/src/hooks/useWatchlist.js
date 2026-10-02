import { useContext } from 'react';
import { WatchlistContext } from '../context/WatchlistContext';

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return ctx;
}
