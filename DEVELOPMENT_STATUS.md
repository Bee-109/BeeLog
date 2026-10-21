# BeeLog Development Status

## Stage A — Audit (complete)

- The React, TypeScript, and Vite application is in `beelog-web/`.
- The charcoal-and-gold public dashboard, public/admin UI separation, Supabase Auth provider, category/project distinction, repositories, media gallery/upload controls, activity page, and SQL authorization/content migrations already exist.
- The current build passes with `npm.cmd run build` from `beelog-web/`.
- `package.json` has no test script and no existing test/spec files were found. The available checks are build and lint; tests will be added for the new data/filter/date behavior as implementation stages establish those seams.
- `src/App.tsx` is approximately 1,545 lines and currently owns the dashboard, projects, timeline, media, activity, and tag pages. Navigation is React state only; there is no router or direct project URL support.
- Homepage hero, quotes, pinned projects, statistics, media ordering, and the calendar are embedded in JSX. Devlog filtering is currently search plus a selected project/category. The calendar uses deterministic generated values rather than devlog creation dates.
- Domain models do not yet contain original timestamps, activity types, structured devlog content/media, project slugs/details/work items, homepage settings, or subscriptions. The mock repository mutates module memory and resets on a full reload. Supabase has no Realtime subscription adapter.
- Supabase Auth and schema code remain unconfigured and untested against a real project.

## Planned stages

- **Stage B — Shared data layer:** expand typed domain entities, repository operations/subscriptions, and realistic mock seed data without replacing the existing UI.
- **Stage C — Devlog experience:** combined dynamic filters, sorting, removable filter chips, compact expandable cards, and date-aware records.
- **Stage D — Project detail:** stable slugs/routes, rich public detail layout, and structured project editor.
- **Stage E — Homepage management:** repository-backed hero, quotes, featured projects, and section settings.
- **Stage F — Dynamic integration:** media/category/tag/activity relationships and a repository-driven heatmap.
- **Stage G — Supabase preparation:** PostgreSQL schema, RLS, Storage, Realtime wiring, and configuration documentation.
- **Stage H — Verification:** tests, build, route/CRUD checks, and public/admin boundary review.

At every stage, update this file with the result, build/test status, remaining gaps, and Supabase configuration requirements. Until a Supabase project is configured and checked, authentication, persistence, Storage, Realtime, and RLS must continue to be described as prepared but unverified.

## Stage B — Shared data layer (complete)

- Expanded typed models for project presentation, devlog metadata, homepage content, project work breakdowns, media metadata, and activity records.
- Extended the repository interface with homepage and project work category/item operations. Mock and Supabase adapters implement the interface; mock mutations notify subscribers, and the Supabase adapter subscribes to relevant content tables plus private activity for admins.
- Added original creation/update timestamps and meaningful homepage/project seed data while retaining existing mock portfolio entries.
- Split the auth context/hook from the provider to keep the service boundary lint-clean.
- **Verification:** `npm.cmd run build` passes; `npm.cmd run lint` passes. No test harness exists yet; focused tests are planned with filter/date utilities.
- **Supabase limitation:** repository methods expect `homepage_content`, `project_work_categories`, and `project_work_items` tables. They are not usable against a Supabase project until Stage G migrations are applied and tested. Authentication, persistence, Realtime, Storage, and RLS remain unconfigured/unverified.

## Stage C — Devlog experience (complete)

- Added a typed, independently testable filter/sort utility. It combines text search, category/project IDs, AND-matched tags, creation-date range (including custom), activity, content type, structured metadata, recent updates, admin-only publication state, and four sort modes.
- Connected dynamic filter controls to the Timeline, with project options narrowed by category, active filter chips, clear-all behavior, and a matching count. Public content is already restricted by the existing repository/RLS boundary; draft status is only selectable in the admin UI.
- Kept cards concise, shortened visible descriptions to about 90 characters, displayed tags, and added a keyboard/touch accessible quick-view disclosure for extra metadata and links.
- Added Node's built-in test runner and two filter tests. **Verification:** `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run test` all pass (2 tests).
- **Known gap:** app filtering currently uses the shared mock activity-type options; Stage G will load configured values from Supabase. Filter persistence in the URL is not implemented.

## Stage D — Project detail and routing (complete)

- Added `/projects/:slug` navigation without adding a router dependency. Project cards and pinned links open the detail URL; browser back/forward and direct refresh use the URL, and project records created through the UI receive a slug.
- Added a responsive portfolio detail page with cover hero/fallback, project summary, optional role/status/release metadata, tags, stored statistics with source labels, media, project notes, and related devlogs.
- Added an admin detail editor for core project presentation fields, tags, genres, platforms, and the primary action. Drafts remain visible only to admins.
- **Verification:** build and lint pass; all 3 tests pass.
- **Supabase limitation:** rich project fields currently rely on columns to be added in Stage G. Direct URLs require the host to serve the Vite SPA fallback (Vite dev/preview do).

## Stage E — Homepage management (complete)

- Replaced hardcoded homepage headline/subtitle/action, hero image positioning, featured/pinned projects, quote, project cards/covers, section headings/visibility, and dashboard counts with repository-backed content.
- Added an admin-only homepage editor for publication status, hero fields, featured projects, quote management, and section titles/descriptions/visibility. Updates go through the repository and trigger mock/Supabase change notifications.
- Removed fabricated dashboard totals in favor of counts derived from published logs, projects, and media.
- Added a mock repository notification/round-trip test. **Verification:** `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run test` pass (3 tests).
- **Known gap:** the existing homepage hierarchy remains intact; Projects, Recent Devlogs, and Latest Media can be reordered within the current layout, while the heatmap stays grouped with media. Hero artwork can use a URL or a published media record.
- **Supabase limitation:** homepage writes/read require the `homepage_content` table and policies planned in Stage G. No remote persistence has been tested.

## Stage F — Dynamic integration (complete)

- Replaced synthetic heatmap cells with daily published-devlog creation counts. Cell levels and click-through to the selected date are derived from the original creation timestamp; current-month summary numbers now derive from published devlogs and media.
- Admin home activity now renders the private activity records; public visitors continue to get a recent published-devlog list. Mock edit activity includes before/after field values, while the existing SQL trigger records database before/after snapshots.
- Media gallery filtering now uses actual image/video records. Uploads may link to a project and/or devlog; captions, alt text, ordering, and publication state flow through the media model/repository. Project and devlog tag chips remain visible.
- Project cover art and the homepage hero can reference published media records, avoiding saved expiring signed URLs; signed sources are refreshed during repository reloads. Project work categories and contribution items are editable and publication-filtered.
- Devlog creation now stores the selected activity type; the Supabase adapter reads configured activity types and maps structured devlog fields.
- Added date-aware heatmap tests. **Verification:** build and lint pass; all 5 tests pass.
- **Supabase limitation:** the current migrations predate the new media/devlog fields, activity types, and homepage/work tables. Stage G will add their schema, RLS, and Realtime setup. Supabase remains unconfigured and unverified.

## Stage G — Supabase preparation (complete; not remotely verified)

- Added `202610220001_dynamic_portfolio.sql` after the two existing migrations. It expands publication statuses and project/devlog/media fields; creates homepage, project contribution, and activity-type tables; applies public-published/admin-only RLS; updates private activity snapshots/triggers; and adds the repository tables to Supabase Realtime when available.
- Updated the Supabase adapter for rich project/development fields, homepage content, contribution items, configurable activity types, media metadata, and the new publication states. Signed media URLs are refreshed periodically by reloading the repository snapshot.
- Updated `beelog-web/README.md` with the three-migration order, environment variables, first-admin SQL provisioning, demo limitations, and implemented-versus-unconfigured status.
- **Verification:** TypeScript/Vite build and lint pass; test suite passes. The migration has not been applied to a live/local Supabase instance and its SQL/RLS behavior has not been exercised remotely.
- **Security/configuration remains pending:** set `.env.local`, enable Supabase email/password Auth, apply all three migrations, authorize the first admin using the trusted SQL Editor procedure, and verify anonymous/admin direct requests and Storage policies. No privileged credentials are included.

## Stage H — Verification (complete for the current mock/code environment)

- Added focused Node tests for filter combinations/date semantics, heatmap creation-date counts, project URL slug parsing, and mock repository homepage/work/activity-type operations.
- Final local checks: `npm.cmd run lint` passes; `npm.cmd run build` passes; `npm.cmd run test` passes (7 tests).
- Reviewed the public/admin boundary in code: public UI uses published content; admin activity queries and navigation are guarded by verified admin status; Supabase write policies use `is_beelog_admin()` independently of UI checks; first-admin grants remain server-side.
- **Not verified here:** browser-driven interaction/e2e behavior, SQL migration execution, Supabase Auth, storage access, Realtime delivery, or live RLS against direct requests. These require a configured Supabase project and are not claimed active.
