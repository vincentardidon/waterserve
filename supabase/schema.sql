-- Run this once in the Supabase SQL Editor before using the application.
create extension if not exists pgcrypto;

create type public.account_role as enum ('customer', 'admin', 'maintenance');
create type public.incident_status as enum ('Submitted', 'Assigned', 'In Progress', 'Resolved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.account_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default ('WS-' || upper(encode(gen_random_bytes(8), 'hex'))),
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  barangay text not null,
  description text not null,
  issue_type text not null,
  status public.incident_status not null default 'Submitted',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incident_history (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  status public.incident_status not null,
  note text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Resident',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index incidents_customer_id_idx on public.incidents(customer_id);
create index incidents_assigned_to_idx on public.incidents(assigned_to);
create index incidents_status_idx on public.incidents(status);
create index incident_history_incident_id_idx on public.incident_history(incident_id, created_at);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), lower(new.email));
  return new;
end;
$$;
create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_history enable row level security;

revoke all on public.profiles, public.incidents, public.incident_history from anon, authenticated;
grant select on public.profiles, public.incidents, public.incident_history to authenticated;
create policy profiles_select_own_or_admin on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy incidents_select_authorized on public.incidents for select to authenticated
  using ((select public.is_admin()) or customer_id = (select auth.uid()) or assigned_to = (select auth.uid()));
create policy history_select_authorized on public.incident_history for select to authenticated
  using (exists (
    select 1 from public.incidents i where i.id = incident_id and
    ((select public.is_admin()) or i.customer_id = (select auth.uid()) or i.assigned_to = (select auth.uid()))
  ));

create or replace function public.create_incident(
  p_customer_name text, p_phone text, p_address text, p_barangay text,
  p_description text, p_issue_type text, p_consent boolean
) returns text language plpgsql security definer set search_path = '' as $$
declare new_incident public.incidents;
begin
  if not exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'customer') then
    raise exception 'Sign in with a customer account to submit a report.' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 100
    or length(trim(coalesce(p_phone, ''))) not between 7 and 25
    or length(trim(coalesce(p_address, ''))) not between 5 and 300
    or length(trim(coalesce(p_barangay, ''))) not between 2 and 100
    or length(trim(coalesce(p_description, ''))) not between 15 and 3000 then
    raise exception 'Please check the required report details.';
  end if;
  if trim(p_phone) !~ '^[+0-9 ()-]{7,25}$' then raise exception 'Enter a valid contact number.'; end if;
  if p_issue_type not in ('Water leak', 'Broken pipe', 'Low pressure', 'Discolored water', 'No water supply', 'Other issue') then
    raise exception 'Choose a valid issue type.';
  end if;
  if p_consent is distinct from true then raise exception 'Consent is required to submit a report.'; end if;
  insert into public.incidents(customer_id, customer_name, phone, address, barangay, description, issue_type)
  values ((select auth.uid()), p_customer_name, p_phone, p_address, p_barangay, p_description, p_issue_type)
  returning * into new_incident;
  insert into public.incident_history(incident_id, status, note, actor_id, actor_name)
  values (new_incident.id, 'Submitted', 'Your report has been received and is awaiting review.', null, 'Resident');
  return new_incident.tracking_code;
end;
$$;
revoke all on function public.create_incident(text,text,text,text,text,text,boolean) from public;
revoke all on function public.create_incident(text,text,text,text,text,text,boolean) from anon, authenticated;
grant execute on function public.create_incident(text,text,text,text,text,text,boolean) to authenticated;

create or replace function public.public_track_report(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.incidents; viewer public.profiles;
begin
  select * into viewer from public.profiles where id = (select auth.uid());
  if viewer.id is null then raise exception 'Sign in to track reports.' using errcode = '42501'; end if;
  select * into i from public.incidents where tracking_code = upper(trim(p_code));
  if not found then raise exception 'No report found. Check your tracking code.' using errcode = 'P0002'; end if;
  if viewer.role = 'customer' and i.customer_id is distinct from viewer.id then
    raise exception 'No report found. Check your tracking code.' using errcode = 'P0002';
  elsif viewer.role = 'maintenance' and i.assigned_to is distinct from viewer.id then
    raise exception 'No report found. Check your tracking code.' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'report', jsonb_build_object('code', i.tracking_code, 'type', i.issue_type, 'description', i.description,
      'barangay', i.barangay, 'status', i.status, 'created', i.created_at, 'updated', i.updated_at),
    'history', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'status', h.status,
      'note', h.note, 'time', h.created_at) order by h.created_at) from public.incident_history h
      where h.incident_id = i.id and h.is_public), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.public_track_report(text) from public;
revoke all on function public.public_track_report(text) from anon, authenticated;
grant execute on function public.public_track_report(text) to authenticated;

create or replace function public.update_incident(
  p_incident_id uuid, p_action text, p_staff_id uuid default null, p_notes text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; target public.incidents; next_status public.incident_status; message text;
begin
  select * into actor from public.profiles where id = (select auth.uid());
  if actor.id is null or actor.role = 'customer' then raise exception 'Staff sign-in required.' using errcode = '42501'; end if;
  select * into target from public.incidents where id = p_incident_id for update;
  if target.id is null then raise exception 'Report not found.' using errcode = 'P0002'; end if;
  if p_action = 'assign' then
    if actor.role <> 'admin' then raise exception 'Administrator access required.' using errcode = '42501'; end if;
    if target.status not in ('Submitted', 'Assigned') then raise exception 'Work has already started.'; end if;
    if not exists (select 1 from public.profiles where id = p_staff_id and role = 'maintenance') then raise exception 'Select a maintenance staff member.'; end if;
    update public.incidents set assigned_to = p_staff_id, status = 'Assigned', updated_at = now() where id = target.id;
    next_status := 'Assigned'; message := 'A maintenance worker has been assigned to your report.';
  elsif p_action = 'start' then
    if actor.role <> 'admin' and target.assigned_to is distinct from actor.id then raise exception 'This job is not assigned to you.' using errcode = '42501'; end if;
    if target.status <> 'Assigned' then raise exception 'This action is not available for the current status.'; end if;
    update public.incidents set status = 'In Progress', updated_at = now() where id = target.id;
    next_status := 'In Progress'; message := 'The maintenance team has started work on this incident.';
  elsif p_action = 'resolve' then
    if actor.role <> 'admin' and target.assigned_to is distinct from actor.id then raise exception 'This job is not assigned to you.' using errcode = '42501'; end if;
    if target.status <> 'In Progress' then raise exception 'This action is not available for the current status.'; end if;
    if length(trim(coalesce(p_notes, ''))) < 10 then raise exception 'Repair notes must be at least 10 characters.'; end if;
    update public.incidents set status = 'Resolved', updated_at = now() where id = target.id;
    next_status := 'Resolved'; message := trim(p_notes);
  else raise exception 'Unknown incident action.';
  end if;
  insert into public.incident_history(incident_id, status, note, actor_id, actor_name)
  values (target.id, next_status, message, actor.id, actor.full_name);
end;
$$;
revoke all on function public.update_incident(uuid,text,uuid,text) from public;
grant execute on function public.update_incident(uuid,text,uuid,text) to authenticated;

-- Create the first administrator through Supabase Auth, then run:
-- update public.profiles set role = 'admin' where email = 'your-admin@example.com';
