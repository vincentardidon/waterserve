-- Apply this patch to projects that already ran an earlier schema.sql version.
-- It replaces the two functions with corrected history insert column lists.

create or replace function public.create_incident(
  p_customer_name text, p_phone text, p_address text, p_barangay text,
  p_description text, p_issue_type text, p_consent boolean
) returns text language plpgsql security definer set search_path = '' as $$
declare new_incident public.incidents;
begin
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
grant execute on function public.create_incident(text,text,text,text,text,text,boolean) to anon, authenticated;

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
  else
    raise exception 'Unknown incident action.';
  end if;

  insert into public.incident_history(incident_id, status, note, actor_id, actor_name)
  values (target.id, next_status, message, actor.id, actor.full_name);
end;
$$;
revoke all on function public.update_incident(uuid,text,uuid,text) from public;
grant execute on function public.update_incident(uuid,text,uuid,text) to authenticated;
