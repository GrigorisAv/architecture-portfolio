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
