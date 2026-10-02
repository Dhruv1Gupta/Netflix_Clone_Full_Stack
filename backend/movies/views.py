from django.db.models import F, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Movie, MovieTrailer
from .serializers import MovieSerializer, MovieTrailerSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Movies"],
        parameters=[
            OpenApiParameter("genre", str, description="Filter by genre slug, e.g. sci-fi"),
            OpenApiParameter("search", str, description="Case-insensitive match on title or description"),
            OpenApiParameter("featured", bool, description="Only featured titles when true"),
        ],
    ),
    retrieve=extend_schema(tags=["Movies"]),
    create=extend_schema(tags=["Movies"]),
    update=extend_schema(tags=["Movies"]),
    partial_update=extend_schema(tags=["Movies"]),
    destroy=extend_schema(tags=["Movies"]),
    trending=extend_schema(
        tags=["Movies"],
        description="Top 10 by in-app views (ties broken by featured, then newest). "
        "Recomputed on every request, so it moves as people browse — not a fixed list.",
    ),
)
class MovieViewSet(viewsets.ModelViewSet):
    """
    Public read (GET), authenticated write (POST/PUT/PATCH/DELETE).
    The default permission class (IsAuthenticatedOrReadOnly) is set globally.
    """

    serializer_class = MovieSerializer
    pagination_class = None  # the catalog is small; the client expects a plain array

    def get_queryset(self):
        qs = Movie.objects.all().prefetch_related("trailers")
        params = self.request.query_params

        genre = params.get("genre")
        if genre:
            qs = qs.filter(genre=genre)

        search = params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        if params.get("featured", "").lower() in {"1", "true", "yes"}:
            qs = qs.filter(is_featured=True)

        return qs

    def retrieve(self, request, *args, **kwargs):
        # A view "counts" once per request to the detail endpoint. Simple and
        # good enough for a portfolio project; a production system would
        # dedupe by session/IP/time window to resist trivial inflation.
        Movie.objects.filter(pk=kwargs["pk"]).update(views_count=F("views_count") + 1)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def trending(self, request):
        qs = self.get_queryset().order_by("-views_count", "-is_featured", "-release_year")[:10]
        return Response(self.get_serializer(qs, many=True).data)


class MovieTrailerListCreateView(generics.ListCreateAPIView):
    """
    GET  /movies/{movie_id}/trailers/  (public)  - list trailers for a title
    POST /movies/{movie_id}/trailers/  (auth)    - add/replace a trailer for a language
    """

    serializer_class = MovieTrailerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_movie(self):
        from django.shortcuts import get_object_or_404

        return get_object_or_404(Movie, pk=self.kwargs["movie_id"])

    def get_queryset(self):
        return MovieTrailer.objects.filter(movie_id=self.kwargs["movie_id"])

    @extend_schema(tags=["Trailers"])
    def get(self, request, *args, **kwargs):
        self.get_movie()  # 404 if the movie itself doesn't exist
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=["Trailers"])
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        movie = self.get_movie()
        # One trailer per (movie, language): adding again for the same
        # language updates the existing row instead of erroring.
        MovieTrailer.objects.filter(movie=movie, language=serializer.validated_data["language"]).delete()
        serializer.save(movie=movie)


class MovieTrailerDeleteView(generics.DestroyAPIView):
    """DELETE /movies/{movie_id}/trailers/{id}/  (auth)"""

    serializer_class = MovieTrailerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(tags=["Trailers"])
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)

    def get_queryset(self):
        return MovieTrailer.objects.filter(movie_id=self.kwargs["movie_id"])
