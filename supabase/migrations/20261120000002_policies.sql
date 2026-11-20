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
