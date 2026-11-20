-- DS Architect: financial offers (προσφορές).
-- Admin-only table. Clients see a sent offer only through its unguessable link (public_token),
-- via get_public_offer(); they accept (with a drawn signature) or decline via respond_offer().

create table if not exists public.offers (
  id               uuid primary key default gen_random_uuid(),
  number           text not null unique,
  quote_request_id uuid references public.quote_requests (id) on delete set null,
  status           text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  public_token     uuid not null unique default gen_random_uuid(),

  client_name      text not null default '' check (length(client_name) <= 160),
  client_email     text not null default '' check (length(client_email) <= 254),
  client_phone     text not null default '' check (length(client_phone) <= 40),
  client_address   text not null default '' check (length(client_address) <= 300),

  title            text not null default '' check (length(title) <= 200),
  location         text not null default '' check (length(location) <= 200),
  intro            text not null default '' check (length(intro) <= 4000),
  -- [{ id, title, description, quantity, unit, unitPrice }]
  items            jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  discount_percent numeric(5, 2) not null default 0 check (discount_percent between 0 and 100),
  vat_rate         numeric(5, 2) not null default 24 check (vat_rate between 0 and 100),
  payment_terms    text not null default '' check (length(payment_terms) <= 4000),
  terms            text not null default '' check (length(terms) <= 8000),
  notes            text not null default '' check (length(notes) <= 4000),
  -- Snapshot of the issuer (name, role, contact, signature image) when the offer was created/edited,
  -- so later settings changes never alter an offer the client has already seen.
  issuer           jsonb not null default '{}'::jsonb,
  internal_notes   text not null default '' check (length(internal_notes) <= 4000),

  issue_date       date not null default current_date,
  valid_until      date,
  sent_at          timestamptz,
  responded_at     timestamptz,
  client_signed_name text,
  client_signature text check (client_signature is null or length(client_signature) <= 300000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists offers_quote_request_idx on public.offers (quote_request_id);
create index if not exists offers_created_idx on public.offers (created_at desc);

drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at before update on public.offers for each row execute function public.set_updated_at();

-- Offer numbers: ΠΡ-<year>-<sequence in that year>, assigned by the database.
create or replace function public.assign_offer_number()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_year text := to_char(coalesce(new.issue_date, current_date), 'YYYY');
  v_next int;
begin
  if new.number is null or new.number = '' then
    perform pg_advisory_xact_lock(hashtext('offers_number_' || v_year));
    select coalesce(max(split_part(number, '-', 3)::int), 0) + 1 into v_next
      from public.offers where number like 'ΠΡ-' || v_year || '-%';
    new.number := 'ΠΡ-' || v_year || '-' || lpad(v_next::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists offers_number on public.offers;
create trigger offers_number before insert on public.offers for each row execute function public.assign_offer_number();

-- Once the client has answered, the offer is a record: content can no longer be edited.
create or replace function public.lock_answered_offer()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status in ('accepted', 'declined') and (
       new.items is distinct from old.items or new.vat_rate is distinct from old.vat_rate
    or new.discount_percent is distinct from old.discount_percent or new.client_name is distinct from old.client_name
    or new.title is distinct from old.title or new.terms is distinct from old.terms
    or new.payment_terms is distinct from old.payment_terms or new.client_signature is distinct from old.client_signature
  ) then
    raise exception 'offer_locked';
  end if;
  return new;
end;
$$;

drop trigger if exists offers_lock on public.offers;
create trigger offers_lock before update on public.offers for each row execute function public.lock_answered_offer();

alter table public.offers enable row level security;

drop policy if exists "offers: admin all" on public.offers;
create policy "offers: admin all" on public.offers for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.offers from anon;
grant select, insert, update, delete on public.offers to authenticated;

-- ---------------------------------------------------------------------------
-- Public, by link only. payload: { token }
-- Returns the client-facing fields of a non-draft offer, or null.
-- ---------------------------------------------------------------------------
create or replace function public.get_public_offer(payload jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_row   public.offers;
begin
  begin
    v_token := (payload ->> 'token')::uuid;
  exception when others then
    return null;
  end;
  select * into v_row from public.offers where public_token = v_token and status <> 'draft';
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'number', v_row.number, 'status', v_row.status,
    'client_name', v_row.client_name, 'client_email', v_row.client_email, 'client_phone', v_row.client_phone,
    'client_address', v_row.client_address, 'title', v_row.title, 'location', v_row.location, 'intro', v_row.intro,
    'items', v_row.items, 'discount_percent', v_row.discount_percent, 'vat_rate', v_row.vat_rate,
    'payment_terms', v_row.payment_terms, 'terms', v_row.terms, 'notes', v_row.notes, 'issuer', v_row.issuer,
    'issue_date', v_row.issue_date, 'valid_until', v_row.valid_until, 'sent_at', v_row.sent_at,
    'responded_at', v_row.responded_at, 'client_signed_name', v_row.client_signed_name,
    'client_signature', v_row.client_signature
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Public, by link only. payload: { token, accept: boolean, name, signature (PNG data URL, when accepting) }
-- Only a sent, still valid offer can be answered, and only once.
-- ---------------------------------------------------------------------------
create or replace function public.respond_offer(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token  uuid;
  v_accept boolean := coalesce((payload ->> 'accept')::boolean, false);
  v_name   text := trim(coalesce(payload ->> 'name', ''));
  v_sig    text := coalesce(payload ->> 'signature', '');
  v_row    public.offers;
begin
  begin
    v_token := (payload ->> 'token')::uuid;
  exception when others then
    raise exception 'not_found';
  end;
  select * into v_row from public.offers where public_token = v_token for update;
  if not found or v_row.status = 'draft' then raise exception 'not_found'; end if;
  if v_row.status <> 'sent' then raise exception 'already_answered'; end if;
  if v_row.valid_until is not null and v_row.valid_until < current_date then raise exception 'expired'; end if;
  if length(v_name) < 3 or length(v_name) > 120 then raise exception 'invalid:name'; end if;
  if v_accept then
    if v_sig !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' or length(v_sig) < 200 or length(v_sig) > 300000 then
      raise exception 'invalid:signature';
    end if;
  else
    v_sig := null;
  end if;

  update public.offers
     set status = case when v_accept then 'accepted' else 'declined' end,
         responded_at = now(), client_signed_name = v_name, client_signature = v_sig
   where id = v_row.id;

  return jsonb_build_object('status', case when v_accept then 'accepted' else 'declined' end);
end;
$$;

revoke all on function public.get_public_offer(jsonb) from public;
revoke all on function public.respond_offer(jsonb) from public;
grant execute on function public.get_public_offer(jsonb) to anon, authenticated;
grant execute on function public.respond_offer(jsonb) to anon, authenticated;
revoke all on function public.assign_offer_number() from public, anon;
revoke all on function public.lock_answered_offer() from public, anon;
