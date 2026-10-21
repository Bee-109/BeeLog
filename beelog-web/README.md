# BeeLog

BeeLog is a React, TypeScript, and Vite development portfolio. Its public dashboard retains the existing design, search, filters, timeline, project browsing, media gallery, recent devlogs, statistics, and activity heatmap.

## Run the mock portfolio

```sh
npm install
npm run dev
```

Without Supabase environment variables, BeeLog displays mock public content in **Demo · Read only** mode. Visitors can browse without signing in. Login does not simulate an account, and no admin controls are available in this mode. Mock admin changes are intentionally unavailable until a real administrator is authorized.

## Configure Supabase

Copy `.env.example` to `.env.local` and supply the project URL and public client key:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

These values are safe for browser use. Never add a service-role key or other privileged secret to a `VITE_` variable, frontend source, or committed file. Restart Vite after editing environment variables.

Apply the SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/202610210001_admin_users.sql`
2. `supabase/migrations/202610210002_portfolio_content.sql`

The first migration creates a protected administrator allowlist. The second creates normalized category, project, devlog, tag, relationship, media, and private activity tables, published/draft visibility policies, admin-only writes, activity triggers, and a private `beelog-media` storage bucket with RLS policies. Public media is served with time-limited signed URLs after the database verifies its published record.

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

- Supabase Auth email/password login, session restoration, logout, and fail-closed admin membership checks.
- Public browsing through a repository interface, with mock data when Supabase is unconfigured and Supabase-backed reads when configured.
- Admin repository operations for categories, projects, devlogs, tags, and media, including draft/published status. Project categories remain separate from projects; devlogs can optionally reference projects; tags attach to both.
- Database activity triggers record created, edited, and deleted content with changed-field details. Activity is readable only by authorized administrators.
- Public database reads are restricted to published records. Admin content writes and private media storage writes are independently checked by RLS.

## Still requires project configuration and verification

Supabase Auth, data persistence, Storage, and database RLS are **not active or verified** until you configure the environment variables, apply both migrations, provision an administrator, and test the policies in your own Supabase project. This repository has not been connected to a Supabase instance, so its live database behavior and policies have not been integration-tested here. If variables are present but the schema or project is unavailable, the UI reports the load error and does not silently present mock data as live content.
