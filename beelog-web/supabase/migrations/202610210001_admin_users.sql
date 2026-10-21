begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Users can verify their own administrator membership" on public.admin_users;
create policy "Users can verify their own administrator membership"
  on public.admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- There are intentionally no client-side INSERT, UPDATE, or DELETE policies.
-- Provision administrators with the trusted Supabase SQL Editor or another
-- server-side process that does not expose privileged credentials to browsers.

commit;
