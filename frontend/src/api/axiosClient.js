import axios from 'axios';
import { getTokens, setTokens, clearTokens } from '../utils/tokenStorage';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the current access token to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// When a request comes back 401, try exactly one silent refresh
// using the stored refresh token, then replay the original request.
// If the refresh itself fails, wipe tokens so the app falls back
// to a logged-out state instead of looping on 401s.
let refreshPromise = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status !== 401 || isAuthRoute || original._retry) {
      return Promise.reject(error);
    }

    const { refresh } = getTokens();
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh/`, { refresh })
          .then((res) => res.data)
          .finally(() => {
            refreshPromise = null;
          });
      }
      const data = await refreshPromise;
      setTokens({ access: data.access, refresh });
      original.headers.Authorization = `Bearer ${data.access}`;
      return axiosClient(original);
    } catch (refreshError) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    }
  }
);

export default axiosClient;
