begin;

-- Keep categories distinct from projects and add stable project URLs.
alter table public.projects add column if not exists slug text;
update public.projects set slug = coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'project') || '-' || id::text where slug is null or slug = '';
create unique index if not exists projects_slug_key on public.projects(slug);
alter table public.projects alter column slug set not null;
alter table public.projects add column if not exists summary text;
alter table public.projects add column if not exists full_description text;
alter table public.projects add column if not exists role text;
alter table public.projects add column if not exists development_status text not null default 'in-development';
alter table public.projects add column if not exists release_period text;
alter table public.projects add column if not exists cover_image_position text not null default 'center';
alter table public.projects add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('draft','published','unpublished'));
alter table public.projects drop constraint if exists projects_development_status_check;
alter table public.projects add constraint projects_development_status_check check (development_status in ('in-development','on-hold','completed','released'));

alter table public.devlogs add column if not exists activity_type text;
alter table public.devlogs add column if not exists problems_faced text[] not null default '{}';
alter table public.devlogs add column if not exists bugs_fixed text[] not null default '{}';
alter table public.devlogs add column if not exists next_plans text[] not null default '{}';
alter table public.devlogs add column if not exists external_links jsonb not null default '[]'::jsonb;
alter table public.devlogs add column if not exists media_ids bigint[] not null default '{}';
alter table public.devlogs add column if not exists code_snippets jsonb not null default '[]'::jsonb;
alter table public.devlogs drop constraint if exists devlogs_status_check;
alter table public.devlogs add constraint devlogs_status_check check (status in ('draft','published','unpublished'));

alter table public.media add column if not exists alt_text text not null default '';
alter table public.media add column if not exists caption text not null default '';
alter table public.media add column if not exists sort_order integer not null default 0;
alter table public.media drop constraint if exists media_status_check;
alter table public.media add constraint media_status_check check (status in ('draft','published','unpublished'));

alter table public.admin_activity drop constraint if exists admin_activity_entity_type_check;
alter table public.admin_activity add constraint admin_activity_entity_type_check check (entity_type in ('Devlog','Tag','Category','Project','Media','Homepage','Activity Type'));

create or replace function public.touch_beelog_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp
as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at before update on public.projects for each row execute function public.touch_beelog_updated_at();
drop trigger if exists devlogs_touch_updated_at on public.devlogs;
create trigger devlogs_touch_updated_at before update on public.devlogs for each row execute function public.touch_beelog_updated_at();
drop trigger if exists media_touch_updated_at on public.media;
create trigger media_touch_updated_at before update on public.media for each row execute function public.touch_beelog_updated_at();

create table if not exists public.homepage_content (
  id text primary key check (id = 'homepage'), content jsonb not null, updated_at timestamptz not null default now()
);
drop trigger if exists homepage_content_touch_updated_at on public.homepage_content;
create trigger homepage_content_touch_updated_at before update on public.homepage_content for each row execute function public.touch_beelog_updated_at();
alter table public.homepage_content enable row level security;
revoke all on public.homepage_content from anon, authenticated;
grant select on public.homepage_content to anon, authenticated;
grant insert, update, delete on public.homepage_content to authenticated;
drop policy if exists "public reads published homepage" on public.homepage_content;
create policy "public reads published homepage" on public.homepage_content for select to anon, authenticated using (public.is_beelog_admin() or content->>'status' = 'published');
drop policy if exists "admins manage homepage" on public.homepage_content;
create policy "admins manage homepage" on public.homepage_content for all to authenticated using (public.is_beelog_admin()) with check (public.is_beelog_admin());

create table if not exists public.project_work_categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, sort_order integer not null default 0
);
create table if not exists public.project_work_items (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  category_id uuid references public.project_work_categories(id) on delete set null,
  title text not null, description text not null default '',
  status text check (status in ('planned','in-progress','complete')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','unpublished')),
  started_at date, completed_at date, media_ids bigint[] not null default '{}', links jsonb not null default '[]'::jsonb,
  technology_ids text[] not null default '{}', sort_order integer not null default 0
);
alter table public.project_work_categories enable row level security;
alter table public.project_work_items enable row level security;
revoke all on public.project_work_categories, public.project_work_items from anon, authenticated;
grant select on public.project_work_categories, public.project_work_items to anon, authenticated;
grant insert, update, delete on public.project_work_categories, public.project_work_items to authenticated;
drop policy if exists "public reads visible work categories" on public.project_work_categories;
create policy "public reads visible work categories" on public.project_work_categories for select to anon, authenticated using (public.is_beelog_admin() or exists (
  select 1 from public.project_work_items wi join public.projects p on p.id = wi.project_id where wi.category_id = project_work_categories.id and wi.publication_status = 'published' and p.status = 'published'));
drop policy if exists "admins manage work categories" on public.project_work_categories;
create policy "admins manage work categories" on public.project_work_categories for all to authenticated using (public.is_beelog_admin()) with check (public.is_beelog_admin());
drop policy if exists "public reads published project work" on public.project_work_items;
create policy "public reads published project work" on public.project_work_items for select to anon, authenticated using (public.is_beelog_admin() or (publication_status = 'published' and exists (
  select 1 from public.projects p where p.id = project_id and p.status = 'published')));
drop policy if exists "admins manage project work" on public.project_work_items;
create policy "admins manage project work" on public.project_work_items for all to authenticated using (public.is_beelog_admin()) with check (public.is_beelog_admin());

create table if not exists public.activity_types (
  id bigint generated by default as identity primary key, name text not null unique, enabled boolean not null default true, sort_order integer not null default 0
);
insert into public.activity_types (name, sort_order) values
  ('Asset creation',0),('New feature',1),('Bug fix',2),('Refactoring',3),('Optimization',4),('Experiment or research',5),('UI/UX implementation',6),('Gameplay',7),('Environment or level design',8),('Other',9)
on conflict (name) do nothing;
alter table public.activity_types enable row level security;
revoke all on public.activity_types from anon, authenticated;
grant select on public.activity_types to anon, authenticated;
grant insert, update, delete on public.activity_types to authenticated;
grant usage, select on sequence public.activity_types_id_seq to authenticated;
drop policy if exists "public reads enabled activity types" on public.activity_types;
create policy "public reads enabled activity types" on public.activity_types for select to anon, authenticated using (enabled or public.is_beelog_admin());
drop policy if exists "admins manage activity types" on public.activity_types;
create policy "admins manage activity types" on public.activity_types for all to authenticated using (public.is_beelog_admin()) with check (public.is_beelog_admin());

-- Activity is private and keeps before/after snapshots for real audit details.
create or replace function public.record_beelog_activity()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  old_data jsonb; new_data jsonb; entity_name text; entity_title text; entity_context text := ''; event_action text; change_details text;
begin
  if tg_op = 'DELETE' then old_data := to_jsonb(old); new_data := null; event_action := 'deleted';
  elsif tg_op = 'INSERT' then old_data := null; new_data := to_jsonb(new); event_action := 'created';
  else old_data := to_jsonb(old); new_data := to_jsonb(new); event_action := 'edited'; end if;
  entity_name := case tg_table_name when 'project_categories' then 'Category' when 'projects' then 'Project' when 'project_tags' then 'Project' when 'project_work_categories' then 'Project' when 'project_work_items' then 'Project' when 'devlogs' then 'Devlog' when 'devlog_tags' then 'Devlog' when 'tags' then 'Tag' when 'homepage_content' then 'Homepage' when 'activity_types' then 'Activity Type' else 'Media' end;
  entity_title := case when tg_table_name = 'homepage_content' then 'Homepage content' else coalesce(new_data->>'name', new_data->>'title', old_data->>'name', old_data->>'title', 'Untitled') end;
  if tg_table_name = 'projects' then
    select name into entity_context from public.project_categories where id = coalesce((new_data->>'category_id')::bigint, (old_data->>'category_id')::bigint);
  elsif tg_table_name = 'project_work_items' then
    select name into entity_context from public.projects where id = coalesce((new_data->>'project_id')::bigint, (old_data->>'project_id')::bigint);
  elsif tg_table_name = 'project_tags' then
    select p.name, t.name into entity_title, change_details from public.projects p, public.tags t where p.id = coalesce((new_data->>'project_id')::bigint, (old_data->>'project_id')::bigint) and t.id = coalesce((new_data->>'tag_id')::bigint, (old_data->>'tag_id')::bigint);
    entity_context := 'Project tags';
  elsif tg_table_name = 'devlog_tags' then
    select d.title, t.name into entity_title, change_details from public.devlogs d, public.tags t where d.id = coalesce((new_data->>'devlog_id')::bigint, (old_data->>'devlog_id')::bigint) and t.id = coalesce((new_data->>'tag_id')::bigint, (old_data->>'tag_id')::bigint);
    entity_context := 'Devlog tags';
  elsif tg_table_name = 'homepage_content' then entity_context := 'Homepage';
  elsif tg_table_name = 'activity_types' then entity_context := 'Activity Types'; end if;
  if tg_table_name in ('project_tags','devlog_tags') then change_details := 'Tag association ' || case when event_action = 'deleted' then 'removed' else 'added' end || ': ' || coalesce(change_details, 'tag');
  elsif event_action = 'edited' and tg_table_name = 'homepage_content' then
    select string_agg('content.' || changed.key || ': ' || coalesce((old_data->'content'->changed.key)::text, 'null') || ' → ' || coalesce((new_data->'content'->changed.key)::text, 'null'), '; ')
      into change_details from jsonb_object_keys(new_data->'content') as changed(key)
      where old_data->'content'->changed.key is distinct from new_data->'content'->changed.key;
    change_details := coalesce(change_details, 'Homepage content updated.');
  elsif event_action = 'edited' then
    select string_agg(changed.key || ': ' || coalesce(old_data->>changed.key, '∅') || ' → ' || coalesce(new_data->>changed.key, '∅'), '; ')
      into change_details from jsonb_object_keys(new_data) as changed(key)
      where old_data->changed.key is distinct from new_data->changed.key and changed.key not in ('updated_at');
  else change_details := event_action || ' record.'; end if;
  insert into public.admin_activity(actor_id, action, entity_type, title, context, details, before_after)
  values (auth.uid(), event_action, entity_name, entity_title, entity_context, coalesce(change_details, 'Record updated.'), jsonb_build_object('before', old_data, 'after', new_data));
  return coalesce(new, old);
end;
$$;
drop trigger if exists homepage_content_activity on public.homepage_content;
create trigger homepage_content_activity after insert or update or delete on public.homepage_content for each row execute function public.record_beelog_activity();
drop trigger if exists activity_types_activity on public.activity_types;
create trigger activity_types_activity after insert or update or delete on public.activity_types for each row execute function public.record_beelog_activity();
drop trigger if exists project_work_categories_activity on public.project_work_categories;
create trigger project_work_categories_activity after insert or update or delete on public.project_work_categories for each row execute function public.record_beelog_activity();
drop trigger if exists project_work_items_activity on public.project_work_items;
create trigger project_work_items_activity after insert or update or delete on public.project_work_items for each row execute function public.record_beelog_activity();
drop trigger if exists project_tags_activity on public.project_tags;
create trigger project_tags_activity after insert or delete on public.project_tags for each row execute function public.record_beelog_activity();
drop trigger if exists devlog_tags_activity on public.devlog_tags;
create trigger devlog_tags_activity after insert or delete on public.devlog_tags for each row execute function public.record_beelog_activity();

-- Realtime events are hints only; every refresh read still passes through RLS.
do $$
declare target_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach target_table in array array['project_categories','projects','devlogs','tags','project_tags','devlog_tags','media','homepage_content','project_work_categories','project_work_items','activity_types','admin_activity'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target_table) then
        execute format('alter publication supabase_realtime add table public.%I', target_table);
      end if;
    end loop;
  end if;
end $$;

commit;
