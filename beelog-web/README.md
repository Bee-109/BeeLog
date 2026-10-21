# BeeLog

BeeLog is a React, TypeScript, and Vite development portfolio. The existing charcoal-and-gold dashboard is preserved, with public browsing, advanced devlog filters, project detail routes, media, timeline, search, statistics, and a date-driven activity heatmap.

## Run the mock portfolio

```sh
npm install
npm run dev
```

Available local checks:

```sh
npm run lint
npm run build
npm test
```

Without Supabase environment variables, BeeLog displays mock public content in **Demo · Read only** mode. Visitors can browse without signing in. Login does not simulate an account, and no admin controls are available in this mode. Mock admin changes are intentionally unavailable until a real administrator is authorized.

## Configure Supabase

Copy `.env.example` to `.env.local` and supply the project URL and public client key:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

These values are safe for browser use. Never add a service-role key or other privileged secret to a `VITE_` variable, frontend source, or committed file. Restart Vite after editing environment variables.

Apply the SQL migrations in order in the Supabase SQL Editor (or through the Supabase CLI):

1. `supabase/migrations/202610210001_admin_users.sql`
2. `supabase/migrations/202610210002_portfolio_content.sql`
3. `supabase/migrations/202610220001_dynamic_portfolio.sql`

The first migration creates a protected administrator allowlist. The second creates normalized category, project, devlog, tag, relationship, media, and private activity tables, base publication policies, activity triggers, and a private `beelog-media` storage bucket. The third adds stable project slugs, rich project/devlog/media fields, homepage settings, project contribution tables, configurable activity types, published/unpublished RLS, activity auditing, and Realtime publication entries. Public media uses time-limited signed URLs after RLS verifies its published record.

Enable Supabase Auth email/password sign-in and create or invite the initial account from the Supabase dashboard. Keep public sign-up disabled unless the site needs it. Then, as the trusted Supabase project owner, authorize the first administrator through the SQL Editor (replace the email):

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do nothing;
```

This provisioning step is deliberately server-side. The browser has no policy to add or modify `admin_users`; authenticated users can only check their own membership. Revoke access by deleting the user's row through the SQL Editor. Authentication by itself never grants admin access.

## Implemented integration

- Repository interfaces with in-memory mock data in demo mode and a Supabase adapter selected when the project URL/key are configured.
- Real Supabase Auth email/password login, session restoration, logout, and fail-closed `admin_users` membership checks. Authentication alone never exposes admin controls.
- Admin-only editing for homepage content, project details/contributions, categories, devlogs, tags, media, and publication state. Public users can browse published content without an account.
- Project categories stay separate from projects; projects exist without devlogs, devlogs can optionally reference projects, and tags attach to projects and devlogs.
- Database-backed activity records include before/after row snapshots and are readable only by authorized administrators.
- Public content reads and admin writes are intended to be independently enforced by RLS, including private media storage.

## Still requires project configuration and verification

Supabase Auth, persistent database writes, Storage, Realtime, and RLS are **not active or verified** in this checkout. Configure environment variables, apply all three migrations, provision an administrator, enable email/password Auth, and test public/admin requests against your Supabase project before relying on remote security or persistence. This repository has not been connected to a Supabase instance, so its live database behavior, migration execution, Storage policies, and RLS have not been integration-tested here. If variables are present but the schema/project is unavailable, BeeLog reports a load error and does not silently use the mock portfolio as live content.

Mock data is kept in memory for the current browser session and resets on a full reload. Demo mode is deliberately read-only and cannot unlock administrator controls.
