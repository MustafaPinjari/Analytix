import os
from celery import Celery

# Set default settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("insightflow_bi")

# Configure Celery using values defined in settings with 'CELERY_' prefix
app.config_from_object("django.conf:settings", namespace="CELERY")

# Discover tasks from all INSTALLED_APPS
app.autodiscover_tasks()
