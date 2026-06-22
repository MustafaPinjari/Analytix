from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Celery Local Eager Execution (Bypasses Redis broker requirements for local development)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

