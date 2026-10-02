from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import MovieTrailerDeleteView, MovieTrailerListCreateView, MovieViewSet

router = SimpleRouter()
router.register("", MovieViewSet, basename="movie")

urlpatterns = [
    path("<int:movie_id>/trailers/", MovieTrailerListCreateView.as_view(), name="movie-trailers"),
    path("<int:movie_id>/trailers/<int:pk>/", MovieTrailerDeleteView.as_view(), name="movie-trailer-detail"),
    *router.urls,
]
