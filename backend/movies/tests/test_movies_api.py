from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from movies.models import Movie

User = get_user_model()

VALID = {
    "title": "Oppenheimer",
    "description": "The story of J. Robert Oppenheimer.",
    "genre": "drama",
    "release_year": 2023,
    "poster_url": "https://example.com/oppenheimer.jpg",
    "is_featured": True,
}


class MovieApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="alice@example.com", password="pass1234")
        self.movie = Movie.objects.create(
            title="Inception", description="Dreams within dreams.", genre="sci-fi", release_year=2010
        )
        self.other = Movie.objects.create(
            title="Get Out", description="A weekend visit goes wrong.", genre="horror",
            release_year=2017, is_featured=True,
        )

    def auth(self):
        self.client.force_authenticate(self.user)

    # ---- public reads -----------------------------------------------------
    def test_list_is_public_and_a_plain_array(self):
        res = self.client.get("/api/movies/")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 2)

    def test_list_item_has_documented_fields(self):
        item = self.client.get("/api/movies/").data[0]
        for field in ("id", "title", "description", "genre", "release_year",
                      "poster_url", "is_featured", "created_at", "updated_at"):
            self.assertIn(field, item)

    def test_detail_is_public(self):
        res = self.client.get(f"/api/movies/{self.movie.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["title"], "Inception")

    def test_detail_404(self):
        self.assertEqual(self.client.get("/api/movies/9999/").status_code, 404)

    # ---- write requires auth ----------------------------------------------
    def test_create_requires_auth(self):
        self.assertEqual(self.client.post("/api/movies/", VALID, format="json").status_code, 401)

    def test_update_patch_delete_require_auth(self):
        url = f"/api/movies/{self.movie.id}/"
        self.assertEqual(self.client.put(url, VALID, format="json").status_code, 401)
        self.assertEqual(self.client.patch(url, {"is_featured": True}, format="json").status_code, 401)
        self.assertEqual(self.client.delete(url).status_code, 401)
        self.assertTrue(Movie.objects.filter(id=self.movie.id).exists())

    # ---- CRUD -------------------------------------------------------------
    def test_create(self):
        self.auth()
        res = self.client.post("/api/movies/", VALID, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "Oppenheimer")
        self.assertTrue(Movie.objects.filter(title="Oppenheimer").exists())

    def test_create_without_poster_url_is_allowed(self):
        self.auth()
        payload = {k: v for k, v in VALID.items() if k != "poster_url"}
        self.assertEqual(self.client.post("/api/movies/", payload, format="json").status_code, 201)

    def test_full_update_put(self):
        self.auth()
        res = self.client.put(f"/api/movies/{self.movie.id}/", VALID, format="json")
        self.assertEqual(res.status_code, 200)
        self.movie.refresh_from_db()
        self.assertEqual(self.movie.title, "Oppenheimer")

    def test_partial_update_patch(self):
        self.auth()
        res = self.client.patch(f"/api/movies/{self.movie.id}/", {"is_featured": True}, format="json")
        self.assertEqual(res.status_code, 200)
        self.movie.refresh_from_db()
        self.assertTrue(self.movie.is_featured)
        self.assertEqual(self.movie.title, "Inception")  # untouched

    def test_delete_returns_204(self):
        self.auth()
        res = self.client.delete(f"/api/movies/{self.movie.id}/")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Movie.objects.filter(id=self.movie.id).exists())

    # ---- validation -------------------------------------------------------
    def test_invalid_genre_rejected(self):
        self.auth()
        res = self.client.post("/api/movies/", {**VALID, "genre": "western"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("genre", res.data)

    def test_release_year_bounds(self):
        self.auth()
        for bad in (1500, 3000):
            res = self.client.post("/api/movies/", {**VALID, "release_year": bad}, format="json")
            self.assertEqual(res.status_code, 400, bad)
            self.assertIn("release_year", res.data)

    def test_blank_title_rejected(self):
        self.auth()
        res = self.client.post("/api/movies/", {**VALID, "title": "   "}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("title", res.data)

    def test_invalid_poster_url_rejected(self):
        self.auth()
        res = self.client.post("/api/movies/", {**VALID, "poster_url": "not a url"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("poster_url", res.data)

    def test_missing_required_fields_rejected(self):
        self.auth()
        res = self.client.post("/api/movies/", {"title": "Only a title"}, format="json")
        self.assertEqual(res.status_code, 400)
        for field in ("description", "genre", "release_year"):
            self.assertIn(field, res.data)

    def test_read_only_fields_cannot_be_set(self):
        self.auth()
        res = self.client.post("/api/movies/", {**VALID, "id": 999, "created_at": "2000-01-01T00:00:00Z"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertNotEqual(res.data["id"], 999)
        self.assertNotEqual(res.data["created_at"][:4], "2000")

    # ---- filtering (extras beyond the base contract) ------------------------
    def test_filter_by_genre(self):
        res = self.client.get("/api/movies/?genre=horror")
        self.assertEqual([m["title"] for m in res.data], ["Get Out"])

    def test_search_title_and_description(self):
        self.assertEqual(len(self.client.get("/api/movies/?search=incep").data), 1)
        self.assertEqual(len(self.client.get("/api/movies/?search=weekend").data), 1)
        self.assertEqual(len(self.client.get("/api/movies/?search=zzz").data), 0)

    def test_featured_filter(self):
        res = self.client.get("/api/movies/?featured=true")
        self.assertEqual([m["title"] for m in res.data], ["Get Out"])


class SeedCommandTests(APITestCase):
    def test_seed_creates_expected_data_and_is_idempotent(self):
        call_command("seed_data", verbosity=0)
        call_command("seed_data", verbosity=0)  # second run must not duplicate
        self.assertEqual(User.objects.count(), 3)
        self.assertEqual(Movie.objects.count(), 10)
        self.assertTrue(Movie.objects.filter(is_featured=True).exists())

    def test_seeded_demo_user_can_log_in(self):
        call_command("seed_data", verbosity=0)
        res = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "pass1234"})
        self.assertEqual(res.status_code, 200)


class PlatformEndpointTests(APITestCase):
    def test_health_check(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_openapi_schema_and_swagger_ui_available(self):
        self.assertEqual(self.client.get("/api/schema/").status_code, 200)
        self.assertEqual(self.client.get("/api/docs/").status_code, 200)

    def test_cors_header_for_allowed_origin(self):
        res = self.client.get("/api/movies/", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")
