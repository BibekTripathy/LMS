import os
from pathlib import Path
from datetime import timedelta
from urllib.parse import parse_qs, unquote, urlparse
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '.env'))

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Vercel sets VERCEL=1 in builds and functions; deployed environments default to safe settings.
ON_VERCEL = bool(os.getenv('VERCEL'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', '')
if not SECRET_KEY:
    if ON_VERCEL:
        raise ImproperlyConfigured('SECRET_KEY must be set in the Vercel project environment.')
    SECRET_KEY = 'django-insecure-default-key-for-dev'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False' if ON_VERCEL else 'True') == 'True'

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    
    # Local apps
    'users',
    'courses',
    'enrollments',
    'progress',
    'assessments',
    'ai_study',
    'analytics',
    'certificates',
]

AUTH_USER_MODEL = 'users.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lms_project.urls'

# The SPA authenticates with JWT bearer headers, not cookies, so credentials are not needed.
# Set CORS_ALLOWED_ORIGINS (comma-separated) for any non-local frontend origin.
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if o.strip()
]
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'False') == 'True'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lms_project.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

def _database_from_url(url):
    """Translate a postgres:// URL (as injected by Neon on Vercel) into Django settings."""
    parsed = urlparse(url)
    options = {k: v[0] for k, v in parse_qs(parsed.query).items() if k in ('sslmode', 'options')}
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': parsed.path.lstrip('/'),
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname or '',
        'PORT': str(parsed.port or 5432),
        'OPTIONS': options,
        # Serverless functions are short-lived; let Neon's pooler manage connections.
        'CONN_MAX_AGE': 0,
    }


if os.getenv('DATABASE_URL'):
    DATABASES['default'] = _database_from_url(os.environ['DATABASE_URL'])
elif os.getenv('DB_NAME'):
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Throttle state lives in Django's default (local-memory) cache, so limits are
    # per server process. That is acceptable for the MVP; Redis is out of scope.
    'DEFAULT_THROTTLE_RATES': {
        'ai_generate': os.getenv('AI_GENERATE_RATE_LIMIT', '10/hour'),
    },
}

# SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
# WhiteNoise serves the Django admin's assets straight from the installed apps, so no
# collectstatic step is needed on serverless deployments.
WHITENOISE_USE_FINDERS = True

# Deployed behind Vercel's HTTPS proxy: trust its scheme header and keep cookies secure.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
# The Django admin posts forms, so its HTTPS origins must be trusted for CSRF.
CSRF_TRUSTED_ORIGINS = [
    f'https://{host}' for host in (
        os.getenv('VERCEL_PROJECT_PRODUCTION_URL'), os.getenv('VERCEL_BRANCH_URL'), os.getenv('VERCEL_URL'),
    ) if host
] + [o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()]

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# AI Provider Configuration (keys come only from the environment; see .env.example)
AI_PROVIDER = os.getenv('AI_PROVIDER', 'mock')          # mock | gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
AI_MODEL = os.getenv('AI_MODEL', 'gemini-flash-lite-latest')
AI_REQUEST_TIMEOUT = float(os.getenv('AI_REQUEST_TIMEOUT', '30'))
AI_MAX_RETRIES = int(os.getenv('AI_MAX_RETRIES', '2'))
AI_MAX_RETRY_WAIT = float(os.getenv('AI_MAX_RETRY_WAIT', '10'))
AI_INVALID_OUTPUT_RETRIES = int(os.getenv('AI_INVALID_OUTPUT_RETRIES', '1'))
AI_MAX_INPUT_CHARS = int(os.getenv('AI_MAX_INPUT_CHARS', '20000'))
AI_MAX_OUTPUT_TOKENS = int(os.getenv('AI_MAX_OUTPUT_TOKENS', '4096'))
AI_MCQ_DEFAULT_COUNT = int(os.getenv('AI_MCQ_DEFAULT_COUNT', '5'))
AI_FLASHCARDS_DEFAULT_COUNT = int(os.getenv('AI_FLASHCARDS_DEFAULT_COUNT', '8'))
