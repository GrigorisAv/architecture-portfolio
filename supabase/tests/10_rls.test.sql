-- RLS / RPC behaviour tests. Run after stubs + migrations + seed.
\set ON_ERROR_STOP on
create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end $$;
create or replace function pg_temp.fails(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'PASS: % (blocked: %)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % (statement succeeded)', label;
end $$;

-- Users: one admin, one ordinary authenticated user
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'someone@example.test');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000a');

select pg_temp.fails($$insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000b')$$, 'only one admin row can exist');

-- A draft project for visibility tests
update public.projects set status = 'draft' where slug = 'grafeia-me-fos';

-- ===================== anonymous visitor =====================
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select pg_temp.ok((select count(*) from public.projects) = 7, 'anon sees only published projects (7 of 8)');
select pg_temp.ok((select count(*) from public.projects where slug = 'grafeia-me-fos') = 0, 'anon cannot see draft project');
select pg_temp.ok((select count(*) from public.project_images pi join public.projects p on p.id = pi.project_id where p.slug = 'grafeia-me-fos') = 0, 'anon cannot see images of draft project');
select pg_temp.ok((select count(*) from public.categories) = 4, 'anon reads categories');
select pg_temp.ok(not has_table_privilege('anon', 'public.quote_requests', 'select') and not has_table_privilege('anon', 'public.admins', 'select'), 'anon has no table privilege on quote_requests/admins');
select pg_temp.ok(not has_table_privilege('anon', 'public.projects', 'insert,update,delete'), 'anon has read-only privileges on content');
select pg_temp.ok((select count(*) from public.services) = 4, 'anon reads services');
select pg_temp.ok((select count(*) from public.site_settings) = 1, 'anon reads site settings');
select pg_temp.ok(public.is_admin() = false, 'anon is not admin');
select pg_temp.fails($$select * from public.quote_requests$$, 'anon cannot read quote requests');
select pg_temp.fails($$insert into public.quote_requests (full_name, email, phone, project_type, area, description, privacy_consent) values ('x','a@b.gr','6900000000','allo','x','xxxxxxxxxxxxxxxxxxxxxxxx', true)$$, 'anon cannot insert quote requests directly');
select pg_temp.fails($$select * from public.admins$$, 'anon cannot read admins');
do $$ declare n int; begin
  begin
    update public.projects set title = 'hacked' where slug = 'lefkos-ogkos';
    get diagnostics n = row_count;
  exception when insufficient_privilege then
    n := 0; -- refused outright (no UPDATE privilege for anon): even stronger
  end;
  perform pg_temp.ok(n = 0, 'anon cannot change a project');
end $$;
select pg_temp.fails($$insert into public.categories (slug, label) values ('x', 'x')$$, 'anon cannot create categories');
select pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('media', 'x.jpg')$$, 'anon cannot upload media');

-- Quote RPC: validation
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μα","email":"a@b.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"Μια αρκετά μεγάλη περιγραφή έργου.","privacyConsent":true}')$$, 'rpc rejects short name');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"λάθος","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"Μια αρκετά μεγάλη περιγραφή έργου.","privacyConsent":true}')$$, 'rpc rejects invalid email');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"123","projectType":"allo","area":"Αθήνα","description":"Μια αρκετά μεγάλη περιγραφή έργου.","privacyConsent":true}')$$, 'rpc rejects invalid phone');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"castle","area":"Αθήνα","description":"Μια αρκετά μεγάλη περιγραφή έργου.","privacyConsent":true}')$$, 'rpc rejects unknown project type');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","sizeSqm":"abc","description":"Μια αρκετά μεγάλη περιγραφή έργου.","privacyConsent":true}')$$, 'rpc rejects non-numeric sqm');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"σύντομο","privacyConsent":true}')$$, 'rpc rejects short description');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"Μια αρκετά μεγάλη περιγραφή έργου.","privacyConsent":false}')$$, 'rpc rejects missing consent');
select pg_temp.ok(public.submit_quote_request('{"fullName":"Μαρία Π.","email":"M@Example.gr","phone":"+30 690 000 0000","projectType":"anakainisi","area":"Αθήνα","sizeSqm":"95,5","description":"Ανακαίνιση διαμερίσματος με νέα κουζίνα.","privacyConsent":true}') ->> 'status' = 'sent', 'rpc accepts a valid request');
select pg_temp.ok(public.submit_quote_request('{"fullName":"Bot","email":"bot@spam.test","phone":"6900000000","projectType":"allo","area":"x","description":"spam spam spam spam spam","privacyConsent":true,"website":"http://spam"}') ->> 'status' = 'sent', 'honeypot returns success');
select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"Δεύτερο αίτημα από το ίδιο email.","privacyConsent":true}');
select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"Τρίτο αίτημα από το ίδιο email.","privacyConsent":true}');
select pg_temp.fails($$select public.submit_quote_request('{"fullName":"Μαρία Π.","email":"m@example.gr","phone":"6900000000","projectType":"allo","area":"Αθήνα","description":"Τέταρτο αίτημα μέσα στην ίδια ώρα.","privacyConsent":true}')$$, 'rpc rate-limits 4th request per email/hour');
select pg_temp.ok(not has_function_privilege('anon', 'public.admin_dashboard_stats()', 'execute'), 'anon has no EXECUTE on admin stats');

-- ===================== authenticated, NOT admin =====================
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', false);
select pg_temp.ok(public.is_admin() = false, 'ordinary user is not admin');
select pg_temp.ok((select count(*) from public.projects) = 7, 'ordinary user sees only published projects');
select pg_temp.ok((select count(*) from public.quote_requests) = 0, 'ordinary user sees no quote requests');
select pg_temp.fails($$insert into public.categories (slug, label) values ('x', 'x')$$, 'ordinary user cannot create categories');
select pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('media', 'x.jpg')$$, 'ordinary user cannot upload media');
select pg_temp.fails($$insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000b')$$, 'ordinary user cannot make themselves admin');
do $$ declare n int; begin
  delete from public.projects where slug = 'lefkos-ogkos';
  get diagnostics n = row_count;
  perform pg_temp.ok(n = 0, 'ordinary user delete of project affects 0 rows');
end $$;

-- ===================== admin =====================
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', false);
select pg_temp.ok(public.is_admin(), 'admin is recognised');
select pg_temp.ok((select count(*) from public.projects) = 8, 'admin sees drafts too (8)');
select pg_temp.ok((select count(*) from public.quote_requests) = 3, 'admin reads quote requests (3 stored, honeypot not stored)');
select pg_temp.ok((select size_sqm from public.quote_requests where email = 'm@example.gr' and area = 'Αθήνα' order by created_at limit 1) = 95.5, 'decimal comma sqm stored as 95.5');
select pg_temp.ok((public.admin_dashboard_stats() ->> 'requests_new')::int = 3, 'admin stats count new requests');
insert into public.categories (slug, label, sort_order) values ('test-kat', 'Δοκιμή', 9);
update public.projects set status = 'published' where slug = 'grafeia-me-fos';
select pg_temp.ok((select published_at is not null from public.projects where slug = 'grafeia-me-fos'), 'publishing stamps published_at');
update public.projects set status = 'draft' where slug = 'grafeia-me-fos';
select pg_temp.ok((select published_at is null from public.projects where slug = 'grafeia-me-fos'), 'unpublishing clears published_at');
update public.quote_requests set status = 'read' where email = 'm@example.gr';
insert into storage.objects (bucket_id, name) values ('media', 'projects/test.jpg');
select pg_temp.ok((select count(*) from storage.objects where bucket_id = 'media') = 1, 'admin uploads media');
select pg_temp.fails($$insert into public.projects (slug, title, category_id) select 'Bad Slug', 'x', id from public.categories limit 1$$, 'invalid slug rejected');
select pg_temp.fails($$delete from public.categories where slug = 'katoikies'$$, 'category with projects cannot be deleted');
delete from public.categories where slug = 'test-kat';
reset role;
select 'ALL RLS TESTS PASSED' as result;
