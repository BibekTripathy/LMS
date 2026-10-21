# LMS Project

An AI-assisted Learning Management System: React + TypeScript + Vite + Tailwind CSS on the frontend, Django REST Framework + PostgreSQL on the backend. One Django backend, one database, no Redis/Celery.

| Doc | Contents |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System design and rules |
| [`docs/api-contract.md`](docs/api-contract.md) | Every `/api/v1/` endpoint, payloads and error codes |
| [`docs/database-schema.md`](docs/database-schema.md) | Models and constraints |

## Prerequisites
- Python 3.12 (the version CI and the Dockerfile use; newer 3.x also works)
- Node.js 22.12+ (required by Vite 8 / Vitest 5; CI uses Node 24)
- PostgreSQL 15+ (SQLite is used automatically if `DB_NAME` is not set, which is handy for a quick look)

## 1. Configure environment
```bash
cp .env.example .env      # in the repository root; .env is git-ignored
```
Edit `.env`. The variables are:

| Variable | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | dev placeholder | Django secret. **Set a real value outside local dev** |
| `DEBUG` | `True` | Django debug mode |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | `lms_db` … `5432` | PostgreSQL connection. Leave `DB_NAME` empty to use SQLite |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Frontend origins allowed to call the API |
| `CORS_ALLOW_ALL_ORIGINS` | `False` | Allow any origin (avoid; local troubleshooting only) |
| `AI_PROVIDER` | `mock` | `mock` (offline, deterministic, no key) or `gemini` |
| `GEMINI_API_KEY` | *(empty)* | Gemini Developer API key from <https://aistudio.google.com/apikey>. Backend only |
| `AI_MODEL` | `gemini-flash-lite-latest` | Gemini model. Check current free-tier models/quotas in AI Studio |
| `AI_REQUEST_TIMEOUT` | `30` | Seconds per provider request |
| `AI_MAX_RETRIES` | `2` | Retries for timeouts, 5xx and short rate limits |
| `AI_MAX_RETRY_WAIT` | `10` | Longest provider-requested wait (s) honoured before failing fast |
| `AI_INVALID_OUTPUT_RETRIES` | `1` | Extra attempts when output is malformed or fails validation |
| `AI_MAX_INPUT_CHARS` | `20000` | Max characters of lesson material sent to the provider |
| `AI_MAX_OUTPUT_TOKENS` | `4096` | Max tokens the provider may return |
| `AI_MCQ_DEFAULT_COUNT` / `AI_FLASHCARDS_DEFAULT_COUNT` | `5` / `8` | Default item counts |
| `AI_GENERATE_RATE_LIMIT` | `10/hour` | Per-user limit on AI generation endpoints |

The frontend reads `VITE_API_URL` (default `http://localhost:8000/api/v1`) if you need to point it elsewhere.

## 2. Database
```bash
createdb lms_db            # or: psql -c "CREATE DATABASE lms_db;"
```

## 3. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # http://localhost:8000, health check at /api/health/
```
After pulling changes, always re-run `python manage.py migrate`. When you change models, run `python manage.py makemigrations <app>` and commit the migration together with the model change.

> **Upgrading from the old `ai_resources` app:** it was replaced by `ai_study`. Existing local databases keep an unused `ai_resources_airesource` table, which is harmless. Drop it or recreate the database if you want a clean slate.

## 4. Frontend
```bash
cd frontend
npm ci
npm run dev                          # http://localhost:5173
```

## 5. Demo accounts
Public registration always creates **students**. Create instructor/admin accounts on the server:
```bash
cd backend
python manage.py createsuperuser     # ADMIN role, can use /admin/
python manage.py shell -c "
from users.models import User
User.objects.create_user(email='instructor@demo.local', password='DemoPass123!', role='INSTRUCTOR', first_name='Demo', last_name='Instructor')
User.objects.create_user(email='student@demo.local', password='DemoPass123!', role='STUDENT', first_name='Demo', last_name='Student')
"
```
These credentials are for local demos only. Never create them on a shared or deployed database. You can also change a user's role in Django admin.

## 6. AI study resources
- With `AI_PROVIDER=mock`, the whole generate → edit → publish / convert-to-quiz → revision flow works offline. Output is derived mechanically from the lesson text, so it is only for demos and development.
- For real generation, set `AI_PROVIDER=gemini` and `GEMINI_API_KEY`, then restart the backend. The key is read only from the environment and sent only as an HTTP header from Django. The frontend never sees it.
- Lessons need a `transcript` or `reading_content` before resources can be generated.
- Generated content is always a **draft** until the course instructor reviews and publishes it. Endpoints and error codes are in `docs/api-contract.md` §7.

## 7. Running checks
```bash
# Backend (uses the DB_* settings; the test runner creates and drops its own test database)
cd backend
pytest -q
python manage.py check
python manage.py makemigrations --check --dry-run

# Frontend
cd frontend
npm run lint
npm run typecheck
npm test                             # Vitest + React Testing Library (API calls mocked)
npm run build
```
AI tests never call a real provider. The Gemini adapter is exercised with `httpx.MockTransport`, and API tests inject a fake provider.

CI (`.github/workflows/ci.yml`) runs the backend tests against PostgreSQL, plus frontend lint, type-check, tests and build, on every push and PR to `dev` and `main`.

## Git workflow
`main` is stable, `dev` is the integration branch, and feature branches (`feature/<name>-<topic>`) are cut from `dev` and merged back through reviewed PRs. Never commit `.env`, keys, or database files.
