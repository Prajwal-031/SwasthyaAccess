# SwasthyaAccess — Research-grade starter

A multilingual, accessible healthcare-navigation prototype for English, Kannada and Hindi. This is a **non-diagnostic demonstration**. Facility records are seeded sample data; appointment requests are stored in PostgreSQL but are **not sent to real hospitals**.

## Architecture

- `frontend/`: React + TypeScript + Vite. Browser speech recognition where supported and browser text-to-speech; graceful text-only fallback.
- `backend/`: Python + FastAPI + SQLAlchemy 2 + Alembic.
- Production database: Neon PostgreSQL.
- Backend hosting: Render.
- Frontend hosting: Vercel.
- Speech-to-text: optional `faster-whisper` adapter, disabled unless `WHISPER_ENABLED=true`.
- Intent handling: deterministic, allow-listed intent extraction. No model makes medical decisions or directly executes an appointment.
- `research/`: study protocol, consent checklist and event dictionary.

This package contains deployment configuration and instructions; it does **not** create accounts, provision cloud services, or deploy the application automatically.

## Local quick start

Requirements: Python 3.11+, Node 20+, npm.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env (Windows: copy .env.example .env)
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`. The local example uses SQLite. For managed PostgreSQL, set `DATABASE_URL` to the provider's connection string. The application normalizes `postgres://` and `postgresql://` to SQLAlchemy's `postgresql+psycopg://` driver.

### 2. Frontend

```bash
cd frontend
npm install
# Copy .env.example to .env
npm run dev
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:8000`.

## Production deployment overview

Deploy three separate services: Neon database, Render API, and Vercel frontend. Deploy the backend first so you have its public URL before configuring the frontend. Keep credentials in provider environment-variable settings; never commit `.env` files or paste secrets into chat.

### Step 1 — Create the Neon PostgreSQL database

1. Create a project in Neon and choose a region close to your Render service where possible. Compare available regions rather than assuming one is available.
2. Create or use the default database and role.
3. Copy the connection string from Neon. Prefer the pooled connection string for a web service if Neon offers both pooled and direct options. Ensure SSL is enabled (`sslmode=require`).
4. Keep the connection string private. Do not put it in the frontend or GitHub.

### Step 2 — Push the project to GitHub

1. Extract this ZIP.
2. Create a new **private** GitHub repository, for example `SwasthyaAccess-Research-Grade`.
3. Push the contents of the extracted project folder to the repository root. The root should contain `render.yaml`, `backend/`, `frontend/`, and `research/`.
4. Confirm `.env` files, database credentials, and local database files are not committed. The included `.gitignore` excludes them.

### Step 3 — Deploy the FastAPI backend on Render

**Blueprint method (recommended):**

1. In Render, create a new Blueprint and connect the GitHub repository.
2. Render should detect the root `render.yaml` and propose the `swasthyaaccess-api` web service. Review the settings before applying.
3. After the service is created, open its Environment settings and set:
   - `DATABASE_URL`: the Neon PostgreSQL connection string (server-side secret).
   - `CORS_ORIGINS`: your exact Vercel frontend origin, e.g. `https://your-project.vercel.app` (no trailing slash). Add a comma-separated list only if you have multiple trusted frontend origins.
   - Keep `WHISPER_ENABLED=false` for the first deployment.
4. Deploy. Render runs migrations, seeds the fictional sample facilities, then starts Uvicorn.
5. Open `https://YOUR-RENDER-SERVICE.onrender.com/health`. Expected response includes `"status":"ok"`.
6. Check `https://YOUR-RENDER-SERVICE.onrender.com/docs` and test `GET /api/v1/facilities`.

**If you do not use Blueprint:** create a Python web service with Root Directory `backend`, Build Command `pip install -r requirements.txt`, Start Command `alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and Health Check Path `/health`. Add the same environment variables above.

Note: the first deployment may fail until `DATABASE_URL` is set correctly. Render and Neon plans, availability, region choices, sleep behavior, limits and pricing can change; check the current provider dashboards before selecting a plan.

### Step 4 — Deploy the React frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the project Root Directory to `frontend`.
3. Vercel should detect Vite. Confirm Build Command `npm run build` and Output Directory `dist`. The included `frontend/vercel.json` also records these settings.
4. Add the environment variable `VITE_API_BASE_URL` with the full Render API origin, e.g. `https://YOUR-RENDER-SERVICE.onrender.com` (no trailing slash). This value is public and must not contain secrets.
5. Deploy and open the Vercel URL.
6. Return to Render and set `CORS_ORIGINS` to that exact Vercel origin. Save/redeploy the backend if required.
7. Test facility search and the simulated appointment request in the deployed UI.

If you later add a custom domain, update `CORS_ORIGINS` to include the exact HTTPS origin and redeploy the backend.

### Step 5 — Production smoke checks

- `GET /health` returns HTTP 200.
- `GET /api/v1/facilities` returns seeded demo facilities.
- The frontend can load facilities without a browser CORS error.
- A demo appointment returns a reference and can be retrieved using that reference.
- Invalid dates, unknown facilities and unsupported languages are rejected.
- No real patient data or real hospital booking is involved.

## Whisper speech recognition

Whisper is intentionally disabled in the first deployment. Model downloads and CPU/RAM requirements can make a small service slow or expensive. If you later enable it, install `requirements-whisper.txt`, choose a suitable Render instance, set `WHISPER_ENABLED=true` and select a model with `WHISPER_MODEL`. The current implementation loads the model during a transcription request; it should be changed to cache/reuse the model before serious use. Do not send identifiable patient recordings. Obtain consent and disclose where audio is processed. Browser-native speech recognition may send audio to the browser vendor.

## Important limitations before real research

This is a research prototype, **not production healthcare infrastructure**. Before recruiting participants or storing study data: obtain institutional ethics approval where required; use participant codes rather than names; define retention/deletion rules; review Kannada and Hindi translations with fluent speakers; test accessibility with intended users; and disclose speech processing. The appointment endpoint currently accepts a participant name, so replace that with a non-identifying study code before any real participant study. Do not collect medical histories or identifiable patient data.

Before exposing the app beyond a controlled demo, add rate limiting, abuse protection, database backups, monitoring, a privacy notice, and an appropriate authentication/access-control design. No diagnosis, triage, treatment, medication or emergency decision-making is supported. Appointment creation is a simulated request record only.

## API summary

- `GET /health`
- `GET /api/v1/facilities?query=...&language=en`
- `GET /api/v1/facilities/{facility_id}`
- `POST /api/v1/appointments` — creates a persisted demo request
- `GET /api/v1/appointments/{reference}` — retrieves a demo request
- `POST /api/v1/voice/transcribe` — optional faster-whisper
- `POST /api/v1/intent` — allow-listed intent extraction, no external LLM

## Tests

```bash
cd backend
pytest
```
