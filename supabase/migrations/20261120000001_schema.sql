-- ATELIER STUDIO: content schema (Phase 3)
-- Target: Supabase (Postgres 15+). Uses auth.users / auth.uid() provided by Supabase Auth.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administrators: exactly one allowed (single-admin CMS). No public sign-up.
-- Rows are inserted only by the project owner (SQL editor / service role).
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- At most one admin row, ever.
create unique index admins_single_row on public.admins ((true));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label      text not null check (length(trim(label)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projects + images
-- ---------------------------------------------------------------------------
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (length(trim(title)) between 1 and 160),
  category_id     uuid not null references public.categories (id) on delete restrict,
  summary         text not null default '',
  description     text[] not null default '{}',
  location        text,
  year            integer check (year between 1900 and 2100),
  area_sqm        numeric(10, 2) check (area_sqm > 0),
  status          text not null default 'draft' check (status in ('draft', 'published')),
  featured        boolean not null default false,
  featured_order  integer,
  cover_image_id  uuid,
  is_placeholder  boolean not null default false,
  seo_title       text,
  seo_description text,
  sort_order      integer not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index projects_status_idx on public.projects (status, sort_order);
create index projects_category_idx on public.projects (category_id);

create table public.project_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  -- Storage object path inside the "media" bucket, or "local:<key>" for bundled placeholder photos.
  storage_path text not null,
  alt          text not null default '',
  width        integer check (width > 0),
  height       integer check (height > 0),
  kind         text not null default 'photo' check (kind in ('photo', 'drawing', 'render')),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index project_images_project_idx on public.project_images (project_id, kind, sort_order);

alter table public.projects
  add constraint projects_cover_image_fk
  foreign key (cover_image_id) references public.project_images (id) on delete set null;

-- Keep published_at in sync with status.
create or replace function public.projects_publish_stamp()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Services, page content, site settings
-- ---------------------------------------------------------------------------
create table public.services (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title          text not null check (length(trim(title)) between 1 and 120),
  summary        text not null default '',
  body           text[] not null default '{}',
  includes       text[] not null default '{}',
  image_path     text,
  image_alt      text not null default '',
  sort_order     integer not null default 0,
  is_placeholder boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.page_content (
  key        text primary key check (key ~ '^[a-z0-9_-]+$'),
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id              smallint primary key default 1 check (id = 1),
  studio_name     text not null default 'ATELIER STUDIO',
  tagline         text not null default '',
  architect_name  text,
  architect_role  text not null default '',
  email           text check (email is null or email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  phone           text,
  address         text,
  instagram       text,
  seo_title       text not null default '',
  seo_description text not null default '',
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Quote requests (public submissions go through submit_quote_request() only)
-- ---------------------------------------------------------------------------
create table public.quote_requests (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  email           text not null,
  phone           text not null,
  project_type    text not null check (project_type in ('nea-katoikia', 'anakainisi', 'interior', 'epaggelmatikos', 'allo')),
  area            text not null,
  size_sqm        numeric(10, 2) check (size_sqm > 0 and size_sqm <= 100000),
  description     text not null,
  privacy_consent boolean not null check (privacy_consent),
  status          text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index quote_requests_status_idx on public.quote_requests (status, created_at desc);
create index quote_requests_email_idx on public.quote_requests (lower(email), created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger projects_publish before insert or update of status on public.projects for each row execute function public.projects_publish_stamp();
create trigger services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger page_content_updated_at before update on public.page_content for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger quote_requests_updated_at before update on public.quote_requests for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1) on conflict do nothing;
