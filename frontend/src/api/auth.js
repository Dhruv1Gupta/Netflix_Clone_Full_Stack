import axiosClient from './axiosClient';

// POST /auth/signup/  { email, password } -> { user, tokens }
export function signup({ email, password }) {
  return axiosClient.post('/auth/signup/', { email, password }).then((res) => res.data);
}

// POST /auth/login/  { email, password } -> { user, tokens }
export function login({ email, password }) {
  return axiosClient.post('/auth/login/', { email, password }).then((res) => res.data);
}

// POST /auth/refresh/  { refresh } -> { access }
export function refreshAccessToken(refresh) {
  return axiosClient.post('/auth/refresh/', { refresh }).then((res) => res.data);
}
