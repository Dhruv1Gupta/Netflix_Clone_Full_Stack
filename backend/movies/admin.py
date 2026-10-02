from django.contrib import admin

from .models import Movie, MovieTrailer


class MovieTrailerInline(admin.TabularInline):
    model = MovieTrailer
    extra = 1


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ("title", "genre", "release_year", "is_featured", "views_count", "updated_at")
    list_filter = ("genre", "is_featured")
    search_fields = ("title", "description")
    readonly_fields = ("views_count",)
    inlines = [MovieTrailerInline]
