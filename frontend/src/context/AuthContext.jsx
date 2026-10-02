import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import {
  clearTokens,
  getStoredUser,
  getTokens,
  setStoredUser,
  setTokens,
} from '../utils/tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getTokens().access));
  const [authError, setAuthError] = useState(null);

  // If a background token refresh fails (interceptor), fall back to logged-out.
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const applySession = useCallback((data) => {
    setTokens(data.tokens);
    setStoredUser(data.user);
    setUser(data.user);
    setIsAuthenticated(true);
  }, []);

  const login = useCallback(
    async (credentials) => {
      setAuthError(null);
      try {
        const data = await authApi.login(credentials);
        applySession(data);
        return { ok: true };
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Could not log in. Check your email and password and try again.';
        setAuthError(message);
        return { ok: false, message };
      }
    },
    [applySession]
  );

  const signup = useCallback(
    async (credentials) => {
      setAuthError(null);
      try {
        const data = await authApi.signup(credentials);
        applySession(data);
        return { ok: true };
      } catch (err) {
        const fieldErrors = err.response?.data;
        let message = 'Could not create your account. Please try again.';
        if (fieldErrors && typeof fieldErrors === 'object') {
          const firstKey = Object.keys(fieldErrors)[0];
          const firstVal = fieldErrors[firstKey];
          if (firstVal) {
            message = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
          }
        }
        setAuthError(message);
        return { ok: false, message };
      }
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, authError, login, signup, logout }),
    [user, isAuthenticated, authError, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
