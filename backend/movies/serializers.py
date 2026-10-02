import re

from rest_framework import serializers

from .models import Movie, MovieTrailer, trailer_language_label

# Accepts a bare 11-char YouTube id, or a full youtube.com/youtu.be URL
# (watch?v=, youtu.be/, embed/, shorts/) and normalizes to the bare id.
_YOUTUBE_URL_RE = re.compile(
    r"(?:youtube(?:-nocookie)?\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})"
)


def extract_youtube_id(value):
    value = (value or "").strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value
    match = _YOUTUBE_URL_RE.search(value)
    return match.group(1) if match else None


class MovieTrailerSerializer(serializers.ModelSerializer):
    # Declared explicitly (instead of letting ModelSerializer derive them from
    # the model) so the model's strict RegexValidators don't run against the
    # raw input before validate_<field> below gets a chance to trim/normalize
    # it — e.g. "EN " or a full youtube.com URL should still be accepted.
    language = serializers.CharField(max_length=8)
    youtube_id = serializers.CharField(max_length=200)
    language_label = serializers.SerializerMethodField()

    class Meta:
        model = MovieTrailer
        fields = ("id", "language", "language_label", "youtube_id", "label", "created_at")
        read_only_fields = ("id", "created_at")

    def get_language_label(self, obj) -> str:
        return trailer_language_label(obj.language)

    def validate_language(self, value):
        value = value.strip().lower()
        if not MovieTrailer.LANGUAGE_RE.regex.fullmatch(value):
            raise serializers.ValidationError("Use a language code like 'en', 'hi', or 'pt-BR'.")
        return value

    def validate_youtube_id(self, value):
        video_id = extract_youtube_id(value)
        if not video_id:
            raise serializers.ValidationError(
                "Paste a YouTube link (e.g. https://www.youtube.com/watch?v=...) or an 11-character video id."
            )
        return video_id


class MovieSerializer(serializers.ModelSerializer):
    trailers = MovieTrailerSerializer(many=True, read_only=True)

    class Meta:
        model = Movie
        fields = (
            "id",
            "title",
            "description",
            "genre",
            "release_year",
            "poster_url",
            "is_featured",
            "views_count",
            "trailers",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "views_count", "trailers", "created_at", "updated_at")
        extra_kwargs = {"poster_url": {"required": False, "allow_blank": True}}

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be blank.")
        return value
