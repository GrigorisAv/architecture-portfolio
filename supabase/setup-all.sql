-- DS Architect: πλήρης εγκατάσταση βάσης για Supabase (εκτελέστε ΜΙΑ φορά στο SQL Editor).
-- Παράγεται από: npm run supabase:bundle

-- ===================== supabase/migrations/20261120000001_schema.sql =====================
-- DS Architect: content schema (Phase 3)
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
  studio_name     text not null default 'DS Architect',
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

-- ===================== supabase/migrations/20261120000002_policies.sql =====================
-- DS Architect: Row Level Security
-- Public (anon) can read published content only. Only the single admin can write.
-- Quote requests: no direct table access for the public; submissions go through an RPC.

alter table public.admins          enable row level security;
alter table public.categories      enable row level security;
alter table public.projects        enable row level security;
alter table public.project_images  enable row level security;
alter table public.services        enable row level security;
alter table public.page_content    enable row level security;
alter table public.site_settings   enable row level security;
alter table public.quote_requests  enable row level security;

-- admins: a user may only see whether they themselves are admin. No client writes.
create policy "admins: read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- categories / services / page_content / site_settings: public read, admin write
create policy "categories: public read" on public.categories for select to anon, authenticated using (true);
create policy "categories: admin write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "services: public read" on public.services for select to anon, authenticated using (true);
create policy "services: admin write" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "page_content: public read" on public.page_content for select to anon, authenticated using (true);
create policy "page_content: admin write" on public.page_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "site_settings: public read" on public.site_settings for select to anon, authenticated using (true);
create policy "site_settings: admin update" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects: public sees published only; admin sees and edits everything
create policy "projects: public read published" on public.projects
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "projects: admin insert" on public.projects for insert to authenticated with check (public.is_admin());
create policy "projects: admin update" on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "projects: admin delete" on public.projects for delete to authenticated using (public.is_admin());

-- project_images: visible when the parent project is visible
create policy "project_images: read with project" on public.project_images
  for select to anon, authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and (p.status = 'published' or public.is_admin()))
  );
create policy "project_images: admin write" on public.project_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- quote_requests: admin only (read, update status/notes, delete). No insert policy on purpose.
create policy "quote_requests: admin read" on public.quote_requests for select to authenticated using (public.is_admin());
create policy "quote_requests: admin update" on public.quote_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "quote_requests: admin delete" on public.quote_requests for delete to authenticated using (public.is_admin());

-- Defense in depth: the public roles never touch quote_requests directly.
revoke all on public.quote_requests from anon;
revoke all on public.admins from anon;

-- ---------------------------------------------------------------------------
-- Public quote submission: validated, honeypot-protected, rate-limited.
-- Mirrors src/lib/quoteValidation.ts. Error messages are machine codes the UI maps to Greek text.
-- ---------------------------------------------------------------------------
create or replace function public.submit_quote_request(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name   text := trim(coalesce(payload ->> 'fullName', ''));
  v_email  text := lower(trim(coalesce(payload ->> 'email', '')));
  v_phone  text := trim(coalesce(payload ->> 'phone', ''));
  v_digits text;
  v_type   text := coalesce(payload ->> 'projectType', '');
  v_area   text := trim(coalesce(payload ->> 'area', ''));
  v_size   text := replace(trim(coalesce(payload ->> 'sizeSqm', '')), ',', '.');
  v_sizen  numeric;
  v_desc   text := trim(coalesce(payload ->> 'description', ''));
  v_ok     boolean := coalesce((payload ->> 'privacyConsent')::boolean, false);
  v_trap   text := coalesce(payload ->> 'website', '');
begin
  -- Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if v_trap <> '' then
    return jsonb_build_object('status', 'sent');
  end if;

  if length(v_name) < 3 or length(v_name) > 120 then raise exception 'invalid:fullName'; end if;
  if v_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or length(v_email) > 254 then raise exception 'invalid:email'; end if;
  v_digits := regexp_replace(regexp_replace(v_phone, '[\s\-().]', '', 'g'), '^\+', '');
  if v_digits !~ '^\d{10,15}$' then raise exception 'invalid:phone'; end if;
  if v_type not in ('nea-katoikia', 'anakainisi', 'interior', 'epaggelmatikos', 'allo') then raise exception 'invalid:projectType'; end if;
  if length(v_area) < 1 or length(v_area) > 120 then raise exception 'invalid:area'; end if;
  if v_size <> '' then
    begin
      v_sizen := v_size::numeric;
    exception when others then
      raise exception 'invalid:sizeSqm';
    end;
    if v_sizen <= 0 or v_sizen > 100000 then raise exception 'invalid:sizeSqm'; end if;
  end if;
  if length(v_desc) < 20 or length(v_desc) > 2000 then raise exception 'invalid:description'; end if;
  if not v_ok then raise exception 'invalid:privacyConsent'; end if;

  -- Rate limits: 3 per email per hour, 20 overall per 10 minutes.
  if (select count(*) from public.quote_requests where lower(email) = v_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limited';
  end if;
  if (select count(*) from public.quote_requests where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'rate_limited';
  end if;

  insert into public.quote_requests (full_name, email, phone, project_type, area, size_sqm, description, privacy_consent)
  values (v_name, v_email, v_phone, v_type, v_area, v_sizen, v_desc, true);

  return jsonb_build_object('status', 'sent');
end;
$$;

revoke all on function public.submit_quote_request(jsonb) from public;
grant execute on function public.submit_quote_request(jsonb) to anon, authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Dashboard counters for the admin (one round trip).
create or replace function public.admin_dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'projects_published', (select count(*) from public.projects where status = 'published'),
    'projects_draft',     (select count(*) from public.projects where status = 'draft'),
    'projects_featured',  (select count(*) from public.projects where featured and status = 'published'),
    'requests_new',       (select count(*) from public.quote_requests where status = 'new'),
    'requests_total',     (select count(*) from public.quote_requests)
  );
$$;
-- Supabase's default privileges grant EXECUTE on new functions to anon explicitly,
-- so revoking from PUBLIC is not enough: revoke from anon by name.
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ===================== supabase/migrations/20261120000003_storage.sql =====================
-- DS Architect: media storage
-- Public-read bucket for project/service photos; only the admin can upload, replace or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Listing (and upsert, which the storage API checks with SELECT) is admin-only; public files are served by public URL.
create policy "media: admin read" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ===================== supabase/migrations/20261120000004_grants.sql =====================
-- DS Architect: explicit table privileges.
-- Newer Supabase projects no longer grant table access to the API roles automatically,
-- so every privilege the site needs is granted here, explicitly and minimally.
-- RLS policies (migration 2) still decide WHICH rows each role may see or change.

grant usage on schema public to anon, authenticated;

-- Public content: visitors read (RLS hides drafts); signed-in users may write (RLS allows only the admin).
grant select on public.categories, public.projects, public.project_images, public.services, public.page_content, public.site_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.projects, public.project_images, public.services, public.page_content to authenticated;
grant update on public.site_settings to authenticated;

-- Quote requests: never directly accessible to visitors (they submit through submit_quote_request()).
grant select, update, delete on public.quote_requests to authenticated;

-- Admins: a signed-in user may only read whether they are the admin (RLS: own row). No writes from the API.
grant select on public.admins to authenticated;

-- ===================== supabase/seed.sql =====================
-- Generated by scripts/generate-seed.mjs. Do not edit by hand.
-- PLACEHOLDER content: every project/service is flagged is_placeholder = true.
begin;

insert into public.categories (slug, label, sort_order) values ('katoikies', 'Κατοικίες', 1) on conflict (slug) do nothing;
insert into public.categories (slug, label, sort_order) values ('esoterikoi-xoroi', 'Εσωτερικοί χώροι', 2) on conflict (slug) do nothing;
insert into public.categories (slug, label, sort_order) values ('anakainiseis', 'Ανακαινίσεις', 3) on conflict (slug) do nothing;
insert into public.categories (slug, label, sort_order) values ('epaggelmatikoi-xoroi', 'Επαγγελματικοί χώροι', 4) on conflict (slug) do nothing;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'oikia-tou-orizonta', 'Οικία του Ορίζοντα', c.id, 'Οριζόντιες πλάκες που σκιάζουν, μια δεξαμενή νερού που καθρεφτίζει τον ουρανό και εσωτερικοί χώροι που ανοίγουν ολόκληροι προς το φως.', array['Η κατοικία οργανώνεται σε δύο οριζόντια επίπεδα που προεξέχουν πάνω από τον κήπο, δημιουργώντας βαθιές σκιές το καλοκαίρι και αφήνοντας τον χειμωνιάτικο ήλιο να διεισδύει βαθιά στο εσωτερικό.', 'Το ισόγειο λειτουργεί ως ένας ενιαίος, διαμπερής χώρος: τα υαλοστάσια συρόμενα εξαφανίζονται και το καθιστικό συνεχίζει χωρίς όριο προς τη βεράντα και το νερό.', 'Η παλέτα των υλικών μένει σκόπιμα περιορισμένη: λευκός σοβάς, ξύλο στην οροφή της στέγασης και πέτρα στο δάπεδο, ώστε το φως να είναι ο πραγματικός πρωταγωνιστής.']::text[], null, null, null, 'published', true, 1, true, 1
from public.categories c where c.slug = 'katoikies' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:white-villa-pool', 'Λευκή διώροφη κατοικία με ξύλινη οροφή στη στέγαση και πισίνα υπερχείλισης μπροστά από τη γυάλινη πρόσοψη', 'photo', 0 from public.projects where slug = 'oikia-tou-orizonta' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'oikia-tou-orizonta' and pi.storage_path = 'local:white-villa-pool');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:glass-stair-pool', 'Αιωρούμενη ξύλινη σκάλα μπροστά από γυάλινη πρόσοψη με θέα στην πισίνα', 'photo', 1 from public.projects where slug = 'oikia-tou-orizonta' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'oikia-tou-orizonta' and pi.storage_path = 'local:glass-stair-pool');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:wood-wall-dining', 'Καθιστικό και τραπεζαρία που ανοίγουν σε ξύλινο deck, με επένδυση ξύλου και πέτρινο τζάκι', 'photo', 2 from public.projects where slug = 'oikia-tou-orizonta' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'oikia-tou-orizonta' and pi.storage_path = 'local:wood-wall-dining');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:pool-villa', 'Σύγχρονη διώροφη κατοικία με επάλληλες λευκές πλάκες, μεγάλα υαλοστάσια και πισίνα στον κήπο', 'photo', 3 from public.projects where slug = 'oikia-tou-orizonta' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'oikia-tou-orizonta' and pi.storage_path = 'local:pool-villa');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:white-villa-pool' order by pi.sort_order limit 1) where pr.slug = 'oikia-tou-orizonta' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'lefkos-ogkos', 'Λευκός Όγκος', c.id, 'Καθαροί κυβικοί όγκοι, μικρά ανοίγματα και ασβεστωμένες επιφάνειες: μια σύγχρονη ανάγνωση της κυκλαδίτικης κατοικίας.', array['Η σύνθεση ξεκινά από την παράδοση της κυκλαδίτικης αρχιτεκτονικής: απλοί όγκοι, συμπαγείς τοίχοι και ανοίγματα που κάδρουν συγκεκριμένες θέες αντί να εκθέτουν το εσωτερικό.', 'Οι όγκοι κλιμακώνονται ακολουθώντας την κλίση του εδάφους και σχηματίζουν μικρές αυλές, προστατευμένες από τον αέρα, όπου η καθημερινότητα μεταφέρεται έξω για το μεγαλύτερο μέρος του χρόνου.', 'Στο εσωτερικό, τα χτιστά έπιπλα, οι κόγχες και τα στρογγυλεμένα σοβατίσματα κρατούν τη γλώσσα του κελύφους και δημιουργούν μια ήρεμη, ενιαία ατμόσφαιρα.']::text[], null, null, null, 'published', true, 2, true, 2
from public.categories c where c.slug = 'katoikies' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:cycladic-white-house', 'Λευκή κατοικία από επάλληλους κυβικούς όγκους με μικρά τετράγωνα παράθυρα, κάτω από πεύκα', 'photo', 0 from public.projects where slug = 'lefkos-ogkos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'lefkos-ogkos' and pi.storage_path = 'local:cycladic-white-house');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:minimal-white-room', 'Λιτό λευκό δωμάτιο με σκούρο καναπέ, φυτό, συρταριέρα και επιδαπέδιο φωτιστικό', 'photo', 1 from public.projects where slug = 'lefkos-ogkos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'lefkos-ogkos' and pi.storage_path = 'local:minimal-white-room');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:oak-stair-detail', 'Λευκό κλιμακοστάσιο με δρύινα σκαλοπάτια, μαύρο μεταλλικό κιγκλίδωμα και κρεμαστά φωτιστικά', 'photo', 2 from public.projects where slug = 'lefkos-ogkos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'lefkos-ogkos' and pi.storage_path = 'local:oak-stair-detail');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:villa-pool-terrace', 'Λευκή κατοικία με βεράντα, φοίνικα και πισίνα με γαλάζιο νερό', 'photo', 3 from public.projects where slug = 'lefkos-ogkos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'lefkos-ogkos' and pi.storage_path = 'local:villa-pool-terrace');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:cycladic-white-house' order by pi.sort_order limit 1) where pr.slug = 'lefkos-ogkos' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'esoteriko-fos', 'Εσωτερικό Φως', c.id, 'Ένα καθιστικό ανοιχτής κάτοψης όπου το ξύλο, ο λευκός σοβάς και τα μαλακά υφάσματα ισορροπούν με το φυσικό φως.', array['Ο σχεδιασμός του εσωτερικού χώρου ξεκίνησε από τη μελέτη του φωτός κατά τη διάρκεια της ημέρας. Οι ζώνες καθιστικού, φαγητού και εργασίας τοποθετήθηκαν εκεί όπου το φως ταιριάζει σε κάθε χρήση.', 'Μια συνεχής ξύλινη επένδυση ενώνει τους χώρους και κρύβει αποθηκευτικούς χώρους, τεχνικά δίκτυα και πόρτες, ώστε οι επιφάνειες να μένουν καθαρές.', 'Τα έπιπλα και τα υφάσματα επιλέχθηκαν σε ζεστούς, φυσικούς τόνους, με λίγες σκούρες πινελιές που δίνουν βάθος και ρυθμό στη σύνθεση.']::text[], null, null, null, 'published', true, 3, true, 3
from public.categories c where c.slug = 'esoterikoi-xoroi' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:warm-living-interior', 'Φωτεινό καθιστικό με λευκό καναπέ, στρογγυλά τραπεζάκια και ξύλινη επένδυση τοίχου δίπλα σε μεγάλα ανοίγματα', 'photo', 0 from public.projects where slug = 'esoteriko-fos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'esoteriko-fos' and pi.storage_path = 'local:warm-living-interior');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:dining-stair-interior', 'Τραπεζαρία με σκούρο τραπέζι μπροστά από γυάλινο διαχωριστικό, ξύλινη επένδυση και ανοιχτό κλιμακοστάσιο', 'photo', 1 from public.projects where slug = 'esoteriko-fos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'esoteriko-fos' and pi.storage_path = 'local:dining-stair-interior');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:gallery-living-room', 'Καθιστικό σε ουδέτερους τόνους με λευκό καναπέ, ασπρόμαυρα κάδρα και ανοιχτή θέα στον κήπο', 'photo', 2 from public.projects where slug = 'esoteriko-fos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'esoteriko-fos' and pi.storage_path = 'local:gallery-living-room');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:warm-living-interior' order by pi.sort_order limit 1) where pr.slug = 'esoteriko-fos' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'proopsi-apo-xylo', 'Πρόσοψη από Ξύλο', c.id, 'Σκούρες επιφάνειες, ξύλινες περσίδες και φωτισμένη είσοδος: μια πρόσοψη που αλλάζει χαρακτήρα από τη μέρα στη νύχτα.', array['Η πρόσοψη λειτουργεί ως ένα δεύτερο, ρυθμιζόμενο δέρμα. Κινητές ξύλινες περσίδες φιλτράρουν τον ήλιο και εξασφαλίζουν ιδιωτικότητα χωρίς να κλείνουν τη θέα.', 'Τη μέρα ο όγκος διαβάζεται σκούρος και συμπαγής. Το βράδυ, το φως από το εσωτερικό περνά ανάμεσα στις περσίδες και το κτίριο μοιάζει με φανάρι.', 'Η είσοδος σημειώνεται με μια εσοχή επενδυμένη σε ξύλο, ένα ζεστό κατώφλι ανάμεσα στον δρόμο και το σπίτι.']::text[], null, null, null, 'published', true, 4, true, 4
from public.categories c where c.slug = 'katoikies' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:dark-facade-timber', 'Σκούρα πρόσοψη κατοικίας με κάθετες ξύλινες περσίδες και ζεστό φως στην είσοδο το σούρουπο', 'photo', 0 from public.projects where slug = 'proopsi-apo-xylo' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'proopsi-apo-xylo' and pi.storage_path = 'local:dark-facade-timber');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:hero-dusk-villa', 'Σύγχρονη κατοικία το σούρουπο: σκούρος ορθογώνιος όγκος με κάθετα φωτισμένα ανοίγματα πάνω από λευκή βάση', 'photo', 1 from public.projects where slug = 'proopsi-apo-xylo' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'proopsi-apo-xylo' and pi.storage_path = 'local:hero-dusk-villa');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:timber-black-house', 'Κατοικία με ξύλινο κουτί εισόδου, μαύρη μεταλλική επένδυση και κήπο με αμμοχάλικο', 'photo', 2 from public.projects where slug = 'proopsi-apo-xylo' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'proopsi-apo-xylo' and pi.storage_path = 'local:timber-black-house');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:dark-facade-timber' order by pi.sort_order limit 1) where pr.slug = 'proopsi-apo-xylo' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'gyalino-atelie', 'Γυάλινο Ατελιέ', c.id, 'Ένας χώρος εργασίας με γυάλινα κελύφη, εμφανές σκυρόδεμα και θέα στο πράσινο, σχεδιασμένος για συγκέντρωση και συνεργασία.', array['Ο χώρος οργανώνεται γύρω από ένα μεγάλο κοινό τραπέζι, την καρδιά της ομάδας, ενώ μικρότεροι κλειστοί χώροι προσφέρουν ησυχία για συγκέντρωση.', 'Το εμφανές σκυρόδεμα και τα τεχνικά δίκτυα παραμένουν ορατά, ειλικρινή, και ισορροπούν με το ξύλο και τα μαλακά υφάσματα των επίπλων.', 'Ο φωτισμός σχεδιάστηκε σε επίπεδα: γενικός, εργασίας και ατμόσφαιρας, ώστε ο χώρος να προσαρμόζεται από μια πρωινή σύσκεψη σε μια βραδινή εκδήλωση.']::text[], null, null, null, 'published', true, 5, true, 5
from public.categories c where c.slug = 'epaggelmatikoi-xoroi' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:glass-workspace', 'Χώρος εργασίας με γυάλινους τοίχους, εμφανές σκυρόδεμα στην οροφή και μακρύ τραπέζι συσκέψεων', 'photo', 0 from public.projects where slug = 'gyalino-atelie' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'gyalino-atelie' and pi.storage_path = 'local:glass-workspace');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:office-corridor', 'Μακρύς διάδρομος γραφείων με γυάλινα χωρίσματα, σκούρους τοίχους και ξύλινα ράφια', 'photo', 1 from public.projects where slug = 'gyalino-atelie' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'gyalino-atelie' and pi.storage_path = 'local:office-corridor');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:glass-workspace' order by pi.sort_order limit 1) where pr.slug = 'gyalino-atelie' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'anakainisi-diamerismatos', 'Ανακαίνιση Διαμερίσματος', c.id, 'Ένα διαμέρισμα της δεκαετίας του ’70 αποκτά νέα κάτοψη, σκούρα ξύλινα ντουλάπια και ένα μπάνιο που θυμίζει ιδιωτικό λουτρό.', array['Η ανακαίνιση ξεκίνησε με την αφαίρεση των περιττών χωρισμάτων. Η κουζίνα ενώθηκε με το καθιστικό και ο διάδρομος μετατράπηκε σε χώρο αποθήκευσης.', 'Κρατήθηκαν όσα είχαν αξία: τα αρχικά κουφώματα επισκευάστηκαν και το μωσαϊκό αποκαταστάθηκε στην είσοδο, ως μνήμη του σπιτιού.', 'Στο μπάνιο, οι σκούροι τόνοι, η ελεύθερη μπανιέρα και το ψηλό οριζόντιο παράθυρο δημιουργούν μια ατμόσφαιρα ηρεμίας και ιδιωτικότητας.']::text[], null, null, null, 'published', false, null, true, 6
from public.categories c where c.slug = 'anakainiseis' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:dark-kitchen', 'Κουζίνα με σκούρα ντουλάπια, λευκό πάγκο, ανοιχτά ράφια και κρεμαστό φωτιστικό', 'photo', 0 from public.projects where slug = 'anakainisi-diamerismatos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'anakainisi-diamerismatos' and pi.storage_path = 'local:dark-kitchen');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:stone-bathroom', 'Μπάνιο σε σκούρους τόνους με ελεύθερη μπανιέρα, γυάλινη ντουζιέρα και οριζόντιο παράθυρο ψηλά', 'photo', 1 from public.projects where slug = 'anakainisi-diamerismatos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'anakainisi-diamerismatos' and pi.storage_path = 'local:stone-bathroom');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:calm-bedroom', 'Υπνοδωμάτιο με κρεβάτι σε ουδέτερα υφάσματα, κρεμαστό φωτιστικό και κάδρα στον τοίχο', 'photo', 2 from public.projects where slug = 'anakainisi-diamerismatos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'anakainisi-diamerismatos' and pi.storage_path = 'local:calm-bedroom');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:dark-kitchen' order by pi.sort_order limit 1) where pr.slug = 'anakainisi-diamerismatos' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'oikia-kato-apo-ta-dentra', 'Οικία κάτω από τα Δέντρα', c.id, 'Ένα σπίτι που χτίζεται γύρω από ένα υπεραιωνόβιο δέντρο: γυάλινο ισόγειο, σκούρος όροφος και ο κήπος ως προέκταση του σαλονιού.', array['Το υπάρχον δέντρο του οικοπέδου καθόρισε τη χωροθέτηση: το κτίριο υποχωρεί για να το προστατεύσει και οργανώνει όλους τους χώρους με θέα προς αυτό.', 'Το ισόγειο είναι σχεδόν εξ ολοκλήρου γυάλινο και σκιάζεται από τον όροφο, ο οποίος επενδύεται με σκούρο μέταλλο και ξύλο.', 'Ο κήπος σχεδιάστηκε μαζί με το σπίτι, με ενδημικά φυτά, ελάχιστο πότισμα και διαδρομές που ενώνουν τις εσωτερικές ζώνες με τις υπαίθριες.']::text[], null, null, null, 'published', false, null, true, 7
from public.categories c where c.slug = 'katoikies' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:house-under-tree', 'Σύγχρονη κατοικία με γυάλινο ισόγειο και σκούρο όροφο κάτω από ένα μεγάλο δέντρο', 'photo', 0 from public.projects where slug = 'oikia-kato-apo-ta-dentra' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'oikia-kato-apo-ta-dentra' and pi.storage_path = 'local:house-under-tree');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:timber-house-garden', 'Κατοικία με μαύρη μεταλλική και ξύλινη επένδυση σε κήπο με γρασίδι και ψηλά δέντρα', 'photo', 1 from public.projects where slug = 'oikia-kato-apo-ta-dentra' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'oikia-kato-apo-ta-dentra' and pi.storage_path = 'local:timber-house-garden');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:house-under-tree' order by pi.sort_order limit 1) where pr.slug = 'oikia-kato-apo-ta-dentra' and pr.cover_image_id is null;

insert into public.projects (slug, title, category_id, summary, description, location, year, area_sqm, status, featured, featured_order, is_placeholder, sort_order)
select 'grafeia-me-fos', 'Γραφεία με Φως', c.id, 'Χώροι εργασίας για μια μικρή δημιουργική ομάδα: ανοιχτές ζώνες, γωνιές ανάγνωσης και φυσικό φως σε κάθε θέση.', array['Η πρόταση αντιμετωπίζει το γραφείο σαν σπίτι για την ομάδα: λιγότερες σταθερές θέσεις, περισσότεροι χώροι συνάντησης, ανάγνωσης και χαλάρωσης.', 'Τα χωρίσματα είναι γυάλινα ή χαμηλά, ώστε το φως να φτάνει από τις προσόψεις μέχρι τον πυρήνα της κάτοψης.', 'Τα υλικά (ξύλο, μέταλλο σε ματ φινίρισμα, μάλλινα υφάσματα) επιλέχθηκαν για την αντοχή τους και για την ακουστική άνεση του χώρου.']::text[], null, null, null, 'published', false, null, true, 8
from public.categories c where c.slug = 'epaggelmatikoi-xoroi' on conflict (slug) do nothing;
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:studio-office-lamps', 'Ανοιχτός χώρος γραφείου με μεταλλικά επιδαπέδια φωτιστικά, πολυθρόνες και μεγάλα παράθυρα', 'photo', 0 from public.projects where slug = 'grafeia-me-fos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'grafeia-me-fos' and pi.storage_path = 'local:studio-office-lamps');
insert into public.project_images (project_id, storage_path, alt, kind, sort_order) select id, 'local:office-corridor', 'Μακρύς διάδρομος γραφείων με γυάλινα χωρίσματα, σκούρους τοίχους και ξύλινα ράφια', 'photo', 1 from public.projects where slug = 'grafeia-me-fos' and not exists (select 1 from public.project_images pi join public.projects pp on pp.id = pi.project_id where pp.slug = 'grafeia-me-fos' and pi.storage_path = 'local:office-corridor');
update public.projects pr set cover_image_id = (select pi.id from public.project_images pi where pi.project_id = pr.id and pi.storage_path = 'local:studio-office-lamps' order by pi.sort_order limit 1) where pr.slug = 'grafeia-me-fos' and pr.cover_image_id is null;

insert into public.services (slug, title, summary, body, includes, image_path, image_alt, sort_order, is_placeholder) values ('arxitektonikes-meletes', 'Αρχιτεκτονικές Μελέτες', 'Από την πρώτη ιδέα έως την άδεια και την κατασκευή, για νέες κατοικίες και κτίρια.', array['Κάθε νέο κτίριο ξεκινά από τον τόπο του: το οικόπεδο, τον προσανατολισμό, το κλίμα, τη θέα και τους κανονισμούς που ισχύουν.', 'Η μελέτη εξελίσσεται σε στάδια, από τα πρώτα σκίτσα και τις μακέτες έως τα σχέδια για την άδεια και τα αναλυτικά κατασκευαστικά σχέδια.']::text[], array['Αποτύπωση και ανάλυση οικοπέδου', 'Προμελέτη και εναλλακτικές προτάσεις', 'Οριστική μελέτη και φάκελος άδειας', 'Κατασκευαστικά σχέδια και λεπτομέρειες', 'Συντονισμός με μηχανικούς']::text[], 'local:pool-villa', 'Σύγχρονη διώροφη κατοικία με επάλληλες λευκές πλάκες, μεγάλα υαλοστάσια και πισίνα στον κήπο', 1, true) on conflict (slug) do nothing;
insert into public.services (slug, title, summary, body, includes, image_path, image_alt, sort_order, is_placeholder) values ('interior-design', 'Interior Design', 'Κάτοψη, υλικά, φωτισμός, έπιπλα και λεπτομέρειες, ως μία ενιαία σύνθεση.', array['Ο εσωτερικός χώρος σχεδιάζεται ως σύνολο: η κάτοψη, τα υλικά, το φως και τα αντικείμενα αποφασίζονται μαζί, ώστε το αποτέλεσμα να έχει μια καθαρή ταυτότητα.', 'Η μελέτη περιλαμβάνει σχεδιασμό ειδικών κατασκευών, επιλογή επίπλων και υφασμάτων, καθώς και πλήρη τεκμηρίωση για τους συνεργάτες.']::text[], array['Λειτουργική κάτοψη και διαρρύθμιση', 'Μελέτη φωτισμού', 'Υλικά, χρώματα και υφές', 'Ειδικές κατασκευές και έπιπλα', 'Οπτικοποιήσεις']::text[], 'local:dining-stair-interior', 'Τραπεζαρία με σκούρο τραπέζι μπροστά από γυάλινο διαχωριστικό, ξύλινη επένδυση και ανοιχτό κλιμακοστάσιο', 2, true) on conflict (slug) do nothing;
insert into public.services (slug, title, summary, body, includes, image_path, image_alt, sort_order, is_placeholder) values ('anakainiseis', 'Ανακαινίσεις', 'Νέα ζωή σε υπάρχοντες χώρους, με σεβασμό στη μνήμη και στις ανάγκες του σήμερα.', array['Μια καλή ανακαίνιση ξεκινά από την προσεκτική αποτύπωση του υπάρχοντος: τι αξίζει να μείνει, τι πρέπει να αλλάξει και τι μπορεί να αποκτήσει νέα χρήση.', 'Η μελέτη συνοδεύεται από αναλυτικό χρονοπρογραμματισμό και προϋπολογισμό, ώστε οι εργασίες να εξελίσσονται με διαφάνεια και χωρίς εκπλήξεις.']::text[], array['Αποτύπωση και τεχνική αξιολόγηση', 'Νέα διαρρύθμιση χώρων', 'Κουζίνες και λουτρά', 'Προϋπολογισμός και χρονοδιάγραμμα', 'Επίβλεψη εργασιών']::text[], 'local:dark-kitchen', 'Κουζίνα με σκούρα ντουλάπια, λευκό πάγκο, ανοιχτά ράφια και κρεμαστό φωτιστικό', 3, true) on conflict (slug) do nothing;
insert into public.services (slug, title, summary, body, includes, image_path, image_alt, sort_order, is_placeholder) values ('epaggelmatikoi-xoroi', 'Σχεδιασμός Επαγγελματικών Χώρων', 'Γραφεία, καταστήματα και χώροι φιλοξενίας που εκφράζουν την ταυτότητα κάθε επιχείρησης.', array['Ο επαγγελματικός χώρος είναι η πρώτη εικόνα μιας επιχείρησης. Ο σχεδιασμός μεταφράζει την ταυτότητά της σε υλικά, φως και διαδρομές.', 'Ιδιαίτερη προσοχή δίνεται στη λειτουργικότητα, στην ακουστική, στην αντοχή των υλικών και στη συμβατότητα με τους κανονισμούς.']::text[], array['Λειτουργικό πρόγραμμα και κάτοψη', 'Σχεδιασμός με βάση την ταυτότητα', 'Φωτισμός και ακουστική', 'Ειδικές κατασκευές', 'Συντονισμός υλοποίησης']::text[], 'local:studio-office-lamps', 'Ανοιχτός χώρος γραφείου με μεταλλικά επιδαπέδια φωτιστικά, πολυθρόνες και μεγάλα παράθυρα', 4, true) on conflict (slug) do nothing;

insert into public.page_content (key, content) values ('about', '{"intro":"Ένα ανεξάρτητο στούντιο αρχιτεκτονικής και εσωτερικού σχεδιασμού, με προσωπική σχέση με κάθε έργο και κάθε πελάτη.","bio":["Εδώ θα παρουσιαστεί το βιογραφικό της αρχιτέκτονα: σπουδές, επαγγελματική διαδρομή και τα έργα ή οι συνεργασίες που διαμόρφωσαν τη ματιά της.","Η ενότητα θα συμπληρωθεί με πραγματικά στοιχεία πριν από τη δημοσίευση του ιστότοπου."],"philosophy":[{"title":"Ο χώρος ως εμπειρία","text":"Ένα κτίριο δεν κρίνεται μόνο από την εικόνα του, αλλά από το πώς το ζει κανείς κάθε μέρα."},{"title":"Λιγότερα, καλύτερα","text":"Λίγα υλικά, προσεκτικές λεπτομέρειες και ήρεμες αναλογίες αντέχουν στον χρόνο."},{"title":"Σεβασμός στον τόπο","text":"Το φως, το κλίμα και η μνήμη κάθε τόπου είναι η αφετηρία κάθε πρότασης."}],"approach":[{"title":"Προσωπική συνεργασία","text":"Η αρχιτέκτονας παρακολουθεί προσωπικά κάθε έργο, από την πρώτη συνάντηση έως την παράδοση."},{"title":"Διαφάνεια","text":"Σαφή στάδια, κατανοητά σχέδια και ρεαλιστικός προϋπολογισμός σε κάθε βήμα."},{"title":"Συνεργάτες","text":"Ένα δίκτυο μηχανικών και τεχνιτών που μοιράζεται την ίδια φροντίδα για την ποιότητα."}],"portrait":null,"isPlaceholder":true}'::jsonb) on conflict (key) do nothing;

update public.site_settings set studio_name = 'DS Architect', tagline = 'Η τέχνη του χώρου', architect_name = null, architect_role = 'Αρχιτέκτων Μηχανικός', email = null, phone = null, address = null, instagram = null, seo_title = 'DS Architect — Αρχιτεκτονική & Εσωτερικοί Χώροι', seo_description = 'DS Architect: ανεξάρτητο στούντιο αρχιτεκτονικής και εσωτερικού σχεδιασμού. Κατοικίες, ανακαινίσεις και επαγγελματικοί χώροι με μεσογειακό φως και καθαρές αναλογίες.' where id = 1;

commit;
