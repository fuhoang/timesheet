## Release Checklist v1.0.0

## Pre-Release

- [ ] `dev` is green in CI (`php-tests`, `js-tests`)
- [ ] UAT script completed: `/docs/release/UAT-v1.0.md`
- [ ] No unresolved high-priority bugs
- [ ] Migrations reviewed and backward-safe
- [ ] Seeder/demo data commands verified

## Security/Config

- [ ] Production `.env` values verified
- [ ] `APP_KEY`, DB creds, session/cors/sanctum settings verified
- [ ] `APP_DEBUG=false` in production
- [ ] Logs and error monitoring enabled

## Quality Gates

- [ ] `php artisan test` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Theme snapshots updated and reviewed

## Git/GitHub

- [ ] PR merged `dev -> main`
- [ ] `main` and `dev` branch protections enabled
- [ ] Required checks: `php-tests`, `js-tests`

## Release

- [ ] Tag created: `v1.0.0`
- [ ] GitHub release created with notes
- [ ] Release notes shared to team

## Post-Release

- [ ] Smoke check on production
- [ ] Verify login, timer, timesheets, admin pages, reports
- [ ] Triage any post-release issues
- [ ] Start post-release backlog

