from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models


class Movie(models.Model):
    class Genre(models.TextChoices):
        ACTION = "action", "Action"
        COMEDY = "comedy", "Comedy"
        DRAMA = "drama", "Drama"
        HORROR = "horror", "Horror"
        ROMANCE = "romance", "Romance"
        SCI_FI = "sci-fi", "Sci-Fi"
        THRILLER = "thriller", "Thriller"
        DOCUMENTARY = "documentary", "Documentary"

    title = models.CharField(max_length=200)
    description = models.TextField()
    genre = models.CharField(max_length=20, choices=Genre.choices, db_index=True)
    # 1888 is the year of the earliest surviving film (Roundhay Garden Scene).
    release_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1888), MaxValueValidator(2100)]
    )
    poster_url = models.URLField(max_length=500, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    # Incremented once per detail-page view (see MovieViewSet.retrieve). Powers
    # the "Top 10 Trending" row: it's a real, live count of in-app engagement
    # rather than a hardcoded list, so the ranking moves as people browse.
    views_count = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.title} ({self.release_year})"


# Common trailer languages we show a friendly label for. This does not limit
# what can be stored — see MovieTrailer.LANGUAGE_RE below — so a title can
# carry a trailer in a language outside this list; the UI just falls back to
# showing the raw code for anything not named here.
TRAILER_LANGUAGE_LABELS = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "zh": "Chinese",
    "ta": "Tamil",
    "te": "Telugu",
    "ru": "Russian",
    "it": "Italian",
}


def trailer_language_label(code):
    return TRAILER_LANGUAGE_LABELS.get(code, code.upper())


class MovieTrailer(models.Model):
    """A YouTube trailer for a movie, in a given language.

    Embedding via YouTube's own player (youtube-nocookie.com) is what
    standard, legitimate "watch the trailer" features use — the video stays
    hosted and served by YouTube/the rights holder's channel; this only
    stores which video id to embed. At most one trailer per (movie,
    language): adding another in the same language replaces it.
    """

    LANGUAGE_RE = RegexValidator(
        r"^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$",
        "Use a language code like 'en', 'hi', or 'pt-BR'.",
    )
    # A YouTube video id is 11 chars from this alphabet. youtube_id is stored
    # normalized (see MovieTrailerSerializer.validate_youtube_id), which also
    # accepts a full youtube.com/youtu.be URL as input.
    YOUTUBE_ID_RE = RegexValidator(r"^[A-Za-z0-9_-]{11}$", "That doesn't look like a YouTube video id.")

    movie = models.ForeignKey(Movie, related_name="trailers", on_delete=models.CASCADE)
    language = models.CharField(max_length=8, validators=[LANGUAGE_RE])
    youtube_id = models.CharField(max_length=11, validators=[YOUTUBE_ID_RE])
    label = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["language", "id"]
        constraints = [
            models.UniqueConstraint(fields=["movie", "language"], name="one_trailer_per_movie_language")
        ]

    def __str__(self):
        return f"{self.movie.title} trailer ({self.language})"
