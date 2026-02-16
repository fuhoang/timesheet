## Timesheet Web Application

Timesheet is a simple internal time-tracking app for teams. Employees can start/stop timers, log time entries, and submit weekly timesheets. Admins can review, approve, reject, and manage projects and submissions.

## Install & Run (Local)

1. Requirements
   - PHP 8.2+
   - Composer
   - Node.js + npm
   - A database (SQLite works for local)

2. Clone and install dependencies
   ```bash
   git clone <your-repo-url>
   cd timesheet
   composer install
   npm install
   ```

3. App setup
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   - URL profile setup in `.env`:
     - Main app:
       - `ACTIVE_BACKEND_URL="${MAIN_BACKEND_URL}"`
       - `ACTIVE_FRONTEND_URL="${MAIN_FRONTEND_URL}"`
     - Dev app:
       - `ACTIVE_BACKEND_URL="${DEV_BACKEND_URL}"`
       - `ACTIVE_FRONTEND_URL="${DEV_FRONTEND_URL}"`
   - Optional (for admin System Status links):
     - `VITE_GITHUB_REPO_URL=https://github.com/<owner>/<repo>`
   - Clear config after env changes:
     ```bash
     php artisan optimize:clear
     ```

4. Database (MySQL)
   - Create a MySQL database (e.g. `timesheet`)
   - Update `.env`:
     ```
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=timesheet
     DB_USERNAME=your_user
     DB_PASSWORD=your_password
     ```

5. Run migrations
   ```bash
   php artisan migrate
   ```

6. Start the app
   ```bash
   composer run dev
   ```
   - Start only main instance:
     ```bash
     composer run dev:main
     ```
   - Start only dev instance:
     ```bash
     composer run dev:dev
     ```
   - Manual start (recommended for two apps at once):
     ```bash
     # main
     php artisan serve --host=127.0.0.1 --port=8000
     npm run dev:5173

     # dev
     php artisan serve --host=127.0.0.1 --port=8001
     npm run dev:5174
     ```

7. Open in browser
   - Main backend: `http://127.0.0.1:8000`
   - Main frontend (Vite): `http://127.0.0.1:5173`
   - Dev backend: `http://127.0.0.1:8001`
   - Dev frontend (Vite): `http://127.0.0.1:5174`

## Useful Commands

- `composer run dev` runs Laravel + Vite together
- `composer run dev:main` runs main instance (`8000` + `5173`)
- `composer run dev:dev` runs dev instance (`8001` + `5174`)
- `php artisan test` runs backend tests
- `php artisan demo:seed` runs migrations and seeds demo data
- `php artisan demo:seed --fresh` drops all tables, then migrates and seeds

## Theme System

Design tokens are centralized in `/resources/css/app.css`.

- Surface
  - `--app-bg`, `--app-surface`, `--app-surface-2`
- Typography
  - `--app-text`, `--app-muted`, `--app-muted-2`
- Borders and focus
  - `--app-border`, `--app-focus`
- Semantic states
  - `--app-success-*`, `--app-warning-*`, `--app-danger-*`, `--app-info-*`
- Effects
  - `--app-shadow`, `--app-shadow-lg`, `--app-overlay`

Reusable UI class variants for page/component consistency are in:

- `/resources/js/components/ui/themeClasses.js`

## Troubleshooting

- `401 Unauthenticated` on API:
  - Confirm backend/frontend host+port match the same instance in `.env`.
  - Run `php artisan optimize:clear` and restart backend + Vite.
- CORS or CSRF cookie issues:
  - Check `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS` include the active frontend/backend pair.
  - Use one host format consistently (`127.0.0.1`, not mixed with `localhost`).
  - `419 CSRF token mismatch` responses are auto-retried once after refreshing `/sanctum/csrf-cookie`.
- Vite websocket/HMR errors:
  - Restart Vite and hard refresh browser.
  - Ensure Vite is running on the expected port (`5173` or `5174`).
- Session collisions when running two instances:
  - Use different `SESSION_COOKIE` values for main and dev.
  - Prefer separate browser profiles (or normal + incognito) when testing both at once.
- Report performance profiling:
  - Add `profile=1` to `/api/reports` to return `meta.profile.timings_ms` for quick server-side timing checks.
- Admin config diagnostics:
  - Use `/api/admin/config/health` (admin-only) to verify APP/FRONTEND/CORS/SANCTUM alignment.
  - Admin UI: open `/admin/system` for detailed diagnostics and fix hints.

## Recent Changes

- Timer behavior update:
  - Starting a timer on a `submitted` or `rejected` day now reopens that day to `draft`.
  - `approved` days remain locked and timer start is blocked.
- Project visibility update:
  - On user routes (`/`, `/timesheets`, `/reports`), users only see projects assigned to them.
  - Admin routes continue to show the full admin project set.

## Theme QA

- Theme QA checklist and screenshot plan:
  - `/docs/theme-qa-checklist.md`
- Visual regression snapshots for Reports theme states:
  - `/resources/js/pages/Reports/__tests__/themeVisualRegression.test.jsx`
- Run theme regression checks:
  ```bash
  npm test
  npm run build
  ```

### Test Config Health Validator

1. Login as admin and open `http://127.0.0.1:8000/admin/timesheets`.
   - In **System Status**, confirm `Config` shows `ok` when configuration is aligned.

2. Check endpoint directly (admin session required):
   - `GET /api/admin/config/health`
   - Verify response includes `ok`, `failed_count`, and `checks[]`.

3. Negative test (intentional mismatch):
   - Example: set `CORS_ALLOWED_ORIGINS=http://localhost:5173` while `FRONTEND_URL=http://127.0.0.1:5173`
   - Run:
     ```bash
     php artisan optimize:clear
     ```
   - Reload admin timesheets and confirm `Config` shows `issues` with fix hints.

4. Restore values and confirm recovery:
   - Align URL hosts (use one format consistently).
   - Run `php artisan optimize:clear`.
   - Reload page and confirm `Config` returns to `ok`.

5. Run backend tests:
   ```bash
   php artisan test tests/Feature/ConfigHealthEndpointTest.php
   ```

## Suggested Git Flow

Use a shared `dev` branch for day-to-day work, and merge into `main` when ready to release.

1. Work on `dev`
   ```bash
   git switch dev
   git pull
   ```

2. Commit freely on `dev` as you iterate

3. When ready to release, open a PR from `dev` → `main`
   - Optionally add a short test plan and run `php artisan test`
