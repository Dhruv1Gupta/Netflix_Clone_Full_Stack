"""
Idempotent demo data: 3 users (password pass1234) and 10 movies.

Safe to run on every deploy — users are looked up by email and movies by
title, so nothing is duplicated and hand-made changes to other rows are
left alone. Poster images are royalty-free placeholders from picsum.photos
(swap in your own hosted URLs any time via the admin or the API).

Movies are seeded with a starting views_count so the "Top 10 Trending" row
(computed live from Movie.views_count — see movies.views.MovieViewSet.trending)
has a sensible order on a fresh install instead of a flat, empty tie. These
are just plausible demo numbers, not real-world data; real usage will move
the ranking as soon as people start opening movie pages.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from movies.models import Movie

User = get_user_model()

DEMO_PASSWORD = "pass1234"
DEMO_USERS = ["alice@example.com", "bob@example.com", "charlie@example.com"]


def poster(seed):
    return f"https://picsum.photos/seed/{seed}/400/600"


# (title, genre, year, featured, starting views_count, description)
MOVIES = [
    ("Inception", "sci-fi", 2010, True, 5400,
     "A thief who steals corporate secrets through dream-sharing technology is offered a chance to erase his past by planting an idea in a target's mind."),
    ("The Dark Knight", "action", 2008, False, 6100,
     "Gotham's vigilante faces a chaos-loving criminal mastermind who forces the city to question what it is willing to sacrifice."),
    ("Interstellar", "sci-fi", 2014, False, 4800,
     "As Earth's crops fail, a former pilot leads a crew through a wormhole in search of a new home for humanity."),
    ("Parasite", "thriller", 2019, False, 3900,
     "A struggling family schemes its way into the service of a wealthy household, until a hidden secret upends everyone."),
    ("The Godfather", "drama", 1972, False, 2600,
     "The aging patriarch of a crime dynasty hands control to his reluctant youngest son."),
    ("Get Out", "horror", 2017, False, 3100,
     "A young photographer meets his girlfriend's family for a weekend getaway and slowly realizes something is deeply wrong."),
    ("The Grand Budapest Hotel", "comedy", 2014, False, 1800,
     "A legendary concierge and his loyal lobby boy become entangled in the theft of a priceless painting."),
    ("La La Land", "romance", 2016, False, 2200,
     "A jazz pianist and an aspiring actress chase their dreams in Los Angeles while their relationship is tested."),
    ("Free Solo", "documentary", 2018, False, 1200,
     "A climber prepares to scale a 3,000-foot cliff face without ropes or safety gear."),
    ("Mad Max: Fury Road", "action", 2015, False, 3500,
     "In a desert wasteland, a drifter and a rebel warrior race across the sands to escape a tyrant."),
]


class Command(BaseCommand):
    help = "Seed demo users and movies (idempotent)."

    def handle(self, *args, **options):
        created_users = 0
        for email in DEMO_USERS:
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(email=email, password=DEMO_PASSWORD)
                created_users += 1

        created_movies = 0
        for title, genre, year, featured, views, description in MOVIES:
            _, created = Movie.objects.get_or_create(
                title=title,
                defaults={
                    "genre": genre,
                    "release_year": year,
                    "is_featured": featured,
                    "description": description,
                    "poster_url": poster(title.lower().replace(" ", "-").replace(":", "")),
                    "views_count": views,
                },
            )
            created_movies += int(created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created_users} new user(s), {created_movies} new movie(s)."
            )
        )
