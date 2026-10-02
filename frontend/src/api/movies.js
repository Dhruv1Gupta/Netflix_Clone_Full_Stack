import axiosClient from './axiosClient';

// GET /movies/ (public) -> Movie[]
export function listMovies() {
  return axiosClient.get('/movies/').then((res) => res.data);
}

// GET /movies/{id}/ (public) -> Movie
export function getMovie(id) {
  return axiosClient.get(`/movies/${id}/`).then((res) => res.data);
}

// POST /movies/ (auth) -> Movie
export function createMovie(payload) {
  return axiosClient.post('/movies/', payload).then((res) => res.data);
}

// PUT /movies/{id}/ (auth, full replace) -> Movie
export function updateMovie(id, payload) {
  return axiosClient.put(`/movies/${id}/`, payload).then((res) => res.data);
}

// PATCH /movies/{id}/ (auth, partial) -> Movie
export function patchMovie(id, payload) {
  return axiosClient.patch(`/movies/${id}/`, payload).then((res) => res.data);
}

// DELETE /movies/{id}/ (auth) -> 204 No Content
export function deleteMovie(id) {
  return axiosClient.delete(`/movies/${id}/`);
}

// GET /movies/trending/ (public) -> Movie[] (top 10, recomputed live from views_count)
export function getTrending() {
  return axiosClient.get('/movies/trending/').then((res) => res.data);
}

// POST /movies/{id}/trailers/ (auth) -> Trailer  { language, youtube_id (url or bare id), label? }
export function addTrailer(movieId, payload) {
  return axiosClient.post(`/movies/${movieId}/trailers/`, payload).then((res) => res.data);
}

// DELETE /movies/{id}/trailers/{trailerId}/ (auth)
export function deleteTrailer(movieId, trailerId) {
  return axiosClient.delete(`/movies/${movieId}/trailers/${trailerId}/`);
}

export const GENRES = [
  'action',
  'comedy',
  'drama',
  'horror',
  'romance',
  'sci-fi',
  'thriller',
  'documentary',
];

export const GENRE_LABELS = {
  action: 'Action',
  comedy: 'Comedy',
  drama: 'Drama',
  horror: 'Horror',
  romance: 'Romance',
  'sci-fi': 'Sci-Fi',
  thriller: 'Thriller',
  documentary: 'Documentary',
};
