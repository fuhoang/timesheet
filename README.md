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

4. Database
   - For SQLite, create the file:
     ```bash
     touch database/database.sqlite
     ```
   - Update `.env` to use SQLite:
     ```
     DB_CONNECTION=sqlite
     DB_DATABASE=/absolute/path/to/database/database.sqlite
     ```

5. Run migrations
   ```bash
   php artisan migrate
   ```

6. Start the app
   ```bash
   composer run dev
   ```

7. Open in browser
   - Backend: http://localhost:8000
   - Frontend (Vite): http://localhost:5173

## Useful Commands

- `composer run dev` runs Laravel + Vite together
- `php artisan test` runs backend tests
