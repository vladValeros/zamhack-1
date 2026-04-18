create table public.activity_logs (
  id            uuid primary key default uuid_generate_v4(),
  -- 'admin' = action taken by admin, 'company' = action taken by a company user
  log_type      text not null check (log_type in ('admin', 'company')),
  -- the profile who performed the action
  actor_id      uuid not null references public.profiles(id) on delete set null,
  -- for company logs, which org this belongs to; null for admin logs
  organization_id uuid references public.organizations(id) on delete set null,
  -- machine-readable action key e.g. 'challenge.approved', 'org.rejected'
  action        text not null,
  -- what kind of thing was acted on: 'challenge', 'organization', 'user', 'settings', 'pending_edit'
  entity_type   text,
  -- the UUID of the entity (if applicable)
  entity_id     uuid,
  -- human-readable label e.g. the challenge title or org name
  entity_label  text,
  -- any extra structured data (old/new values, rejection reasons, etc.)
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index activity_logs_log_type_idx        on public.activity_logs(log_type);
create index activity_logs_actor_id_idx        on public.activity_logs(actor_id);
create index activity_logs_organization_id_idx on public.activity_logs(organization_id);
create index activity_logs_created_at_idx      on public.activity_logs(created_at desc);
create index activity_logs_action_idx          on public.activity_logs(action);

alter table public.activity_logs enable row level security;

-- Admins can read all logs
create policy "Admins can read activity logs"
  on public.activity_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Service role bypasses RLS for inserts (no insert policy needed for anon/authenticated)
-- Inserts are done server-side using the service role key

-- Backfill: existing approved/rejected organizations (admin logs)
insert into public.activity_logs (log_type, actor_id, organization_id, action, entity_type, entity_id, entity_label, metadata, created_at)
select
  'admin',
  (select id from public.profiles where role = 'admin' order by created_at limit 1), -- fallback to first admin
  o.id,
  case o.status
    when 'active'    then 'org.approved'
    when 'rejected'  then 'org.rejected'
    else 'org.created'
  end,
  'organization',
  o.id,
  o.name,
  jsonb_build_object('status', o.status, 'backfilled', true),
  coalesce(o.updated_at, o.created_at, now())
from public.organizations o
where o.status in ('active', 'rejected', 'pending')
on conflict do nothing;

-- Backfill: existing challenges (company logs)
insert into public.activity_logs (log_type, actor_id, organization_id, action, entity_type, entity_id, entity_label, metadata, created_at)
select
  'company',
  coalesce(c.created_by, (select id from public.profiles where role = 'company_admin' limit 1)),
  c.organization_id,
  case c.status
    when 'approved'         then 'challenge.approved'
    when 'rejected'         then 'challenge.rejected'
    when 'cancelled'        then 'challenge.cancelled'
    when 'pending_approval' then 'challenge.submitted'
    when 'draft'            then 'challenge.created'
    else 'challenge.created'
  end,
  'challenge',
  c.id,
  c.title,
  jsonb_build_object('status', c.status, 'backfilled', true),
  coalesce(c.updated_at, c.created_at, now())
from public.challenges c
where c.created_by is not null
on conflict do nothing;
