# TravelEase UI Refactor (Bootstrap 5 White+Purple)

## Step 0 — Discovery (done)
- Scanned main shell + theme files.
- Identified heavy inline styles and non-purple colors.

## Step 1 — App shell + layout consistency
- [x] Refactor `src/App.jsx` to remove inline layout hacks and rely on Bootstrap utilities.
- [x] Ensure navbar fixed-top height is consistently accounted for across desktop/mobile.

## Step 2 — Navbar refactor
- [ ] Update `src/components/Navbar.jsx` to remove inline styles where possible.
- [ ] Use theme variables/classes for spacing, typography, and avatar.

## Step 3 — Sidebar refactor
- [x] Hide sidebar on login/register while auth is not ready.
- [ ] Update `src/components/Sidebar.jsx` to remove inline sizing/position styles.
- [ ] Ensure responsive behavior (desktop sticky / mobile off-canvas) is consistent.


## Step 4 — Footer refactor
- [ ] Update `src/components/Footer.jsx` to remove custom inline color/shadow where possible.

## Step 5 — DashboardPage wrapper
- [ ] Update `src/pages/DashboardPage.jsx` to remove unnecessary inline styling and align padding.

## Step 6 — Role dashboards + feature components
- [ ] Refactor `src/pages/roles/*.jsx` and embedded feature components.
- [ ] Standardize cards/tables/badges/modals to the white+purple theme.
- [ ] Replace hardcoded colors (e.g., #6f42c1, #00bcd4, dark table styles) with theme variables/classes.

## Step 7 — Cleanup & verification
- [ ] Remove/replace leftover custom CSS classes with Bootstrap utility classes where possible.
- [ ] Manual verify responsive UI on mobile + desktop for: nav, forms, cards, tables, modals.
- [ ] Run lint/build.

