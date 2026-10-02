from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from movies.models import Movie, MovieTrailer

User = get_user_model()


class ViewCountAndTrendingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.low = Movie.objects.create(title="Low", description="d", genre="drama", release_year=2001)
        self.high = Movie.objects.create(title="High", description="d", genre="drama", release_year=2002)
        self.mid = Movie.objects.create(title="Mid", description="d", genre="drama", release_year=2003)

    def test_retrieve_increments_views_count(self):
        self.assertEqual(self.client.get(f"/api/movies/{self.low.id}/").data["views_count"], 1)
        self.assertEqual(self.client.get(f"/api/movies/{self.low.id}/").data["views_count"], 2)
        self.assertEqual(self.client.get(f"/api/movies/{self.low.id}/").data["views_count"], 3)

    def test_listing_does_not_increment_views(self):
        self.client.get("/api/movies/")
        self.client.get("/api/movies/")
        self.low.refresh_from_db()
        self.assertEqual(self.low.views_count, 0)

    def test_trending_orders_by_views_desc_and_recomputes_live(self):
        for _ in range(5):
            self.client.get(f"/api/movies/{self.high.id}/")
        for _ in range(2):
            self.client.get(f"/api/movies/{self.mid.id}/")

        res = self.client.get("/api/movies/trending/")
        self.assertEqual(res.status_code, 200)
        titles = [m["title"] for m in res.data]
        self.assertEqual(titles[:3], ["High", "Mid", "Low"])

        # one more view for "Low" changes the live ranking without any admin edit
        for _ in range(10):
            self.client.get(f"/api/movies/{self.low.id}/")
        res2 = self.client.get("/api/movies/trending/")
        self.assertEqual([m["title"] for m in res2.data][:1], ["Low"])

    def test_trending_caps_at_ten(self):
        for i in range(15):
            Movie.objects.create(title=f"Extra {i}", description="d", genre="comedy", release_year=2000 + i)
        res = self.client.get("/api/movies/trending/")
        self.assertEqual(len(res.data), 10)

    def test_trending_is_public(self):
        self.assertEqual(self.client.get("/api/movies/trending/").status_code, 200)


class TrailerApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="alice@example.com", password="pass1234")
        self.movie = Movie.objects.create(
            title="Inception", description="d", genre="sci-fi", release_year=2010
        )

    def auth(self):
        self.client.force_authenticate(self.user)

    def test_list_trailers_is_public_and_starts_empty(self):
        res = self.client.get(f"/api/movies/{self.movie.id}/trailers/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, [])

    def test_list_trailers_404_for_missing_movie(self):
        self.assertEqual(self.client.get("/api/movies/999999/trailers/").status_code, 404)

    def test_add_trailer_requires_auth(self):
        res = self.client.post(
            f"/api/movies/{self.movie.id}/trailers/", {"language": "en", "youtube_id": "dQw4w9WgXcQ"}, format="json"
        )
        self.assertEqual(res.status_code, 401)

    def test_add_trailer_with_bare_id(self):
        self.auth()
        res = self.client.post(
            f"/api/movies/{self.movie.id}/trailers/",
            {"language": "en", "youtube_id": "dQw4w9WgXcQ", "label": "Official Trailer"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["youtube_id"], "dQw4w9WgXcQ")
        self.assertEqual(res.data["language_label"], "English")

    def test_add_trailer_accepts_full_youtube_url_and_extracts_id(self):
        self.auth()
        for url in [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
            "https://youtu.be/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        ]:
            res = self.client.post(
                f"/api/movies/{self.movie.id}/trailers/", {"language": "en", "youtube_id": url}, format="json"
            )
            self.assertEqual(res.status_code, 201, url)
            self.assertEqual(res.data["youtube_id"], "dQw4w9WgXcQ", url)

    def test_language_and_id_are_trimmed_and_lowercased(self):
        self.auth()
        res = self.client.post(
            f"/api/movies/{self.movie.id}/trailers/", {"language": " EN ", "youtube_id": "dQw4w9WgXcQ"}, format="json"
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["language"], "en")

    def test_malformed_youtube_id_rejected(self):
        self.auth()
        res = self.client.post(
            f"/api/movies/{self.movie.id}/trailers/", {"language": "en", "youtube_id": "nope"}, format="json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("youtube_id", res.data)

    def test_malformed_language_rejected(self):
        self.auth()
        res = self.client.post(
            f"/api/movies/{self.movie.id}/trailers/",
            {"language": "english!!", "youtube_id": "dQw4w9WgXcQ"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("language", res.data)

    def test_adding_same_language_again_replaces_not_duplicates(self):
        self.auth()
        self.client.post(
            f"/api/movies/{self.movie.id}/trailers/", {"language": "en", "youtube_id": "dQw4w9WgXcQ"}, format="json"
        )
        res = self.client.post(
            f"/api/movies/{self.movie.id}/trailers/", {"language": "en", "youtube_id": "oHg5SJYRHA0"}, format="json"
        )
        self.assertEqual(res.status_code, 201)
        trailers = self.client.get(f"/api/movies/{self.movie.id}/").data["trailers"]
        self.assertEqual(len(trailers), 1)
        self.assertEqual(trailers[0]["youtube_id"], "oHg5SJYRHA0")

    def test_multiple_languages_coexist(self):
        self.auth()
        for lang in ("en", "hi", "es", "fr"):
            self.client.post(
                f"/api/movies/{self.movie.id}/trailers/",
                {"language": lang, "youtube_id": "dQw4w9WgXcQ"},
                format="json",
            )
        trailers = self.client.get(f"/api/movies/{self.movie.id}/").data["trailers"]
        self.assertEqual(sorted(t["language"] for t in trailers), ["en", "es", "fr", "hi"])

    def test_delete_requires_auth(self):
        trailer = MovieTrailer.objects.create(movie=self.movie, language="en", youtube_id="dQw4w9WgXcQ")
        res = self.client.delete(f"/api/movies/{self.movie.id}/trailers/{trailer.id}/")
        self.assertEqual(res.status_code, 401)
        self.assertTrue(MovieTrailer.objects.filter(id=trailer.id).exists())

    def test_delete_removes_trailer(self):
        self.auth()
        trailer = MovieTrailer.objects.create(movie=self.movie, language="en", youtube_id="dQw4w9WgXcQ")
        res = self.client.delete(f"/api/movies/{self.movie.id}/trailers/{trailer.id}/")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(MovieTrailer.objects.filter(id=trailer.id).exists())

    def test_delete_404_for_wrong_movie_or_missing_id(self):
        self.auth()
        other_movie = Movie.objects.create(title="Other", description="d", genre="drama", release_year=2000)
        trailer = MovieTrailer.objects.create(movie=self.movie, language="en", youtube_id="dQw4w9WgXcQ")
        self.assertEqual(
            self.client.delete(f"/api/movies/{other_movie.id}/trailers/{trailer.id}/").status_code, 404
        )
        self.assertEqual(self.client.delete(f"/api/movies/{self.movie.id}/trailers/999999/").status_code, 404)

    def test_deleting_movie_cascades_to_trailers(self):
        self.auth()
        MovieTrailer.objects.create(movie=self.movie, language="en", youtube_id="dQw4w9WgXcQ")
        self.client.delete(f"/api/movies/{self.movie.id}/")
        self.assertEqual(MovieTrailer.objects.count(), 0)

    def test_movie_detail_includes_trailers_inline(self):
        MovieTrailer.objects.create(movie=self.movie, language="en", youtube_id="dQw4w9WgXcQ", label="Trailer")
        res = self.client.get(f"/api/movies/{self.movie.id}/")
        self.assertEqual(len(res.data["trailers"]), 1)
        self.assertEqual(res.data["trailers"][0]["label"], "Trailer")
