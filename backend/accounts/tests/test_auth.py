from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset throttle counters between tests
        self.user = User.objects.create_user(email="alice@example.com", password="pass1234")

    # ---- signup -----------------------------------------------------------
    def test_signup_returns_user_and_tokens(self):
        res = self.client.post(
            "/api/auth/signup/", {"email": "new@example.com", "password": "securepass123"}
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["user"]["email"], "new@example.com")
        self.assertIn("access", res.data["tokens"])
        self.assertIn("refresh", res.data["tokens"])
        self.assertTrue(User.objects.filter(email="new@example.com").exists())

    def test_signup_normalizes_email_case(self):
        res = self.client.post(
            "/api/auth/signup/", {"email": "Mixed@Example.COM", "password": "securepass123"}
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["user"]["email"], "mixed@example.com")

    def test_signup_duplicate_email_rejected_case_insensitively(self):
        res = self.client.post(
            "/api/auth/signup/", {"email": "ALICE@example.com", "password": "securepass123"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("email", res.data)

    def test_signup_short_password_rejected(self):
        res = self.client.post("/api/auth/signup/", {"email": "x@example.com", "password": "short"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("password", res.data)

    def test_signup_invalid_email_rejected(self):
        res = self.client.post("/api/auth/signup/", {"email": "not-an-email", "password": "securepass123"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("email", res.data)

    def test_password_is_hashed_not_stored_plain(self):
        self.client.post("/api/auth/signup/", {"email": "h@example.com", "password": "securepass123"})
        stored = User.objects.get(email="h@example.com").password
        self.assertNotEqual(stored, "securepass123")
        self.assertTrue(stored.startswith(("pbkdf2_", "argon2", "bcrypt")))

    # ---- login ------------------------------------------------------------
    def test_login_success(self):
        res = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "pass1234"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user"], {"id": self.user.id, "email": "alice@example.com"})
        self.assertIn("access", res.data["tokens"])

    def test_login_is_case_insensitive_on_email(self):
        res = self.client.post("/api/auth/login/", {"email": "ALICE@example.com", "password": "pass1234"})
        self.assertEqual(res.status_code, 200)

    def test_login_wrong_password_returns_401_with_detail(self):
        res = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "nope"})
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.data["detail"], "Invalid email or password.")

    def test_login_unknown_email_gives_same_error(self):
        res = self.client.post("/api/auth/login/", {"email": "ghost@example.com", "password": "pass1234"})
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.data["detail"], "Invalid email or password.")

    def test_login_missing_fields_is_400(self):
        res = self.client.post("/api/auth/login/", {})
        self.assertEqual(res.status_code, 400)

    def test_login_inactive_user_rejected(self):
        self.user.is_active = False
        self.user.save()
        res = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "pass1234"})
        self.assertEqual(res.status_code, 401)

    # ---- refresh ----------------------------------------------------------
    def test_refresh_returns_new_access_token(self):
        login = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "pass1234"})
        res = self.client.post("/api/auth/refresh/", {"refresh": login.data["tokens"]["refresh"]})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)

    def test_refresh_with_garbage_token_is_401(self):
        res = self.client.post("/api/auth/refresh/", {"refresh": "garbage"})
        self.assertEqual(res.status_code, 401)

    def test_access_token_grants_access_to_protected_route(self):
        login = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "pass1234"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['tokens']['access']}")
        res = self.client.post(
            "/api/movies/",
            {"title": "T", "description": "D", "genre": "drama", "release_year": 2020},
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    # ---- throttling -------------------------------------------------------
    def test_auth_endpoints_are_rate_limited(self):
        codes = []
        for _ in range(25):
            r = self.client.post("/api/auth/login/", {"email": "alice@example.com", "password": "bad"})
            codes.append(r.status_code)
        self.assertIn(429, codes)


class UserModelTests(APITestCase):
    def test_create_user_requires_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="x")

    def test_create_superuser_flags(self):
        admin = User.objects.create_superuser(email="root@example.com", password="pass1234")
        self.assertTrue(admin.is_staff and admin.is_superuser)
