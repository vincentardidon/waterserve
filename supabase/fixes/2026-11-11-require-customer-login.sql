-- Apply after schema.sql and the history-insert fix on an existing project.
-- Customer report creation and tracking now require an authenticated account.

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
revoke all on function public.create_incident(text,text,text,text,text,text,boolean) from public, anon;
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
revoke all on function public.public_track_report(text) from public, anon;
grant execute on function public.public_track_report(text) to authenticated;
