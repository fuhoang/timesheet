## UAT Script v1.0

Use this script on `dev` before release and on `main` immediately after release.

## Environment

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`
- Admin account: `admin@test.com / password`
- User account: `user@test.com / password`

## User Flow

1. Login as regular user.
Expected:
- Dashboard loads.
- Timer section and Today entries load without API errors.

2. Start timer without selecting project.
Expected:
- Inline error appears (no browser alert).

3. Select project and start timer.
Expected:
- Running indicator appears.
- Entry appears in Today entries.

4. Stop timer.
Expected:
- Running indicator disappears.
- Entry persists with duration.

5. Open Weekly Timesheets and edit one day entry.
Expected:
- Entry edit saves.
- Day total updates.

6. Submit completed week.
Expected:
- Confirmation modal appears.
- Submission succeeds.
- Week shows submitted/locked state.

## Admin Flow

1. Login as admin and open Admin Timesheets.
Expected:
- Table loads.
- Status tabs, filters, and pagination all work.

2. Select one or more timesheets and run bulk approve.
Expected:
- Confirm modal opens.
- Action succeeds and status updates.

3. Select one or more timesheets and run bulk reject.
Expected:
- Reason-required modal opens.
- Reject succeeds with reason.

4. Open Admin Projects and delete a project.
Expected:
- Confirm modal opens (no browser confirm dialog).
- Delete succeeds and list refreshes.

5. Open Admin Rules page.
Expected:
- Rules payload displays.
- Override contract is visible.

## Report Flow

1. Open Reports in light mode.
Expected:
- Filters, rows, status chips, and pagination are readable.

2. Toggle dark mode.
Expected:
- Same sections remain readable with correct contrast.
- Sticky filter wrapper has no extra background utility overlay.

3. Change filters: date, status, project, user, sort, direction, per-page.
Expected:
- Results update correctly.
- No console errors.

4. Export CSV.
Expected:
- CSV downloads with selected filters.

## Keyboard/Accessibility Smoke

1. Navigate main actions using keyboard `Tab`.
Expected:
- Visible focus ring on buttons/inputs/links.

2. In confirm modal:
- Press `Escape` to close.
- Press `Enter` to confirm.
- In reason textarea, press `Ctrl+Enter` to confirm.
Expected:
- Keyboard interactions behave correctly.

## Sign-off

- [ ] User flow passed
- [ ] Admin flow passed
- [ ] Report flow passed
- [ ] Keyboard smoke passed
- [ ] No blocking errors in browser console/network

