-- A small stand-in for the parts of Supabase the migrations rely on, so the
-- data rules can be tested in PGlite (an in-process Postgres) by `npm test`.
-- Real Supabase already has all of this; never apply this file there.
--
-- What it mimics:
-- - the roles anon, authenticated and service_role (service_role skips RLS);
-- - auth.users, with the email and app_metadata Supabase keeps;
-- - auth.uid() and auth.jwt(), read from the request's JWT claims, which
--   tests set with set_config('request.jwt.claims', ..., false);
-- - Supabase's default grants on the public schema.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
