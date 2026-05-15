-- sh1pt-perry-hono-supabase initial schema
-- Apply via: psql "$SUPABASE_DB_URL" -f supabase/schema.sql
-- Or wire into `supabase migration` once you adopt the Supabase CLI.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text not null,
  platform text,
  client_version text,
  public_key text,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  type text not null,
  status text not null default 'queued',
  input jsonb not null default '{}',
  output jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_user_idx on public.jobs (user_id, created_at desc);

create table if not exists public.worker_heartbeats (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  capabilities jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists heartbeats_device_idx on public.worker_heartbeats (device_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  actor_device_id uuid references public.devices(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.jobs enable row level security;
alter table public.worker_heartbeats enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: each user sees and edits their own row
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- devices: owner-scoped
create policy "devices_owner_all" on public.devices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- jobs: owner-scoped
create policy "jobs_owner_all" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- heartbeats: insertable by the device owner; readable by the owner
create policy "heartbeats_owner_select" on public.worker_heartbeats
  for select using (
    exists (
      select 1 from public.devices d
      where d.id = worker_heartbeats.device_id and d.user_id = auth.uid()
    )
  );
create policy "heartbeats_owner_insert" on public.worker_heartbeats
  for insert with check (
    exists (
      select 1 from public.devices d
      where d.id = worker_heartbeats.device_id and d.user_id = auth.uid()
    )
  );

-- audit_logs: owner-readable; writes happen via the API with the service role
create policy "audit_logs_owner_select" on public.audit_logs
  for select using (auth.uid() = user_id);

-- Atomic claim of the next queued job for a device.
-- Marks the row as running and returns it. Uses SKIP LOCKED for concurrency.
create or replace function public.claim_next_job(p_device_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.jobs;
  device_owner uuid;
begin
  select user_id into device_owner from public.devices where id = p_device_id;
  if device_owner is null then
    return null;
  end if;

  with picked as (
    select id from public.jobs
    where status = 'queued' and user_id = device_owner
    order by created_at
    for update skip locked
    limit 1
  )
  update public.jobs j
     set status = 'running',
         device_id = p_device_id,
         updated_at = now()
    from picked
   where j.id = picked.id
   returning j.* into claimed;

  return claimed;
end;
$$;

revoke all on function public.claim_next_job(uuid) from public;
grant execute on function public.claim_next_job(uuid) to authenticated;
