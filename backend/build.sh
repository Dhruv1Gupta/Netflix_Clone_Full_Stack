#!/usr/bin/env bash
# Render build step: install deps, collect static files, migrate, seed demo data.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py seed_data
