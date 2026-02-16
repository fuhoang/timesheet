## Theme QA Checklist

Use this checklist before merging styling changes.

## Scope

- Dashboard
- Timesheets
- Reports
- Admin pages (Projects, Users, Timesheets, Rules, System)
- Auth pages (Login, Register)

## Verify In Light And Dark Mode

- Page background, cards, and borders look consistent.
- Primary text, muted text, and helper text remain readable.
- Status colors (draft/submitted/approved/rejected/error/success/warning/info) are distinguishable.
- Active navigation links are obvious.
- Hover styles are visible but not overpowering.
- Disabled controls are visually distinct.

## Interaction States

- Keyboard `Tab` order is logical for forms, filters, tables, and modals.
- Every actionable element shows focus ring on keyboard focus.
- Sticky filter/header sections do not create unreadable overlays.
- Locked overlays still allow text to remain readable.

## Quick Screenshot Plan

- Capture screenshots for each page in light mode.
- Capture screenshots for each page in dark mode.
- Capture one screenshot each for:
  - active nav
  - focused input
  - hovered button/link
  - rejected/highlighted state card
  - modal open

## Suggested Commands

```bash
# frontend unit tests (includes theme snapshots)
npm test

# build sanity
npm run build
```

