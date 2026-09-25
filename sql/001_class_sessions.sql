-- Class sessions
--
-- Run this once in the Supabase SQL editor
-- (Dashboard -> SQL Editor -> New query -> Run).
--
-- Attendance is scoped to the window between started_at and ended_at.
-- A row with ended_at = null is the session currently running.

create table if not exists public.class_sessions (
    id          bigint generated always as identity primary key,
    name        text        not null,
    started_at  timestamptz not null default now(),
    ended_at    timestamptz
);

create index if not exists class_sessions_started_at_idx
    on public.class_sessions (started_at desc);

-- At most one session may be open at a time. The partial unique index
-- makes a second "start" fail at the database rather than relying on
-- the browser to behave.
create unique index if not exists class_sessions_single_active_idx
    on public.class_sessions ((ended_at is null))
    where ended_at is null;

-- A session cannot finish before it starts.
alter table public.class_sessions
    drop constraint if exists class_sessions_window_check;

alter table public.class_sessions
    add constraint class_sessions_window_check
    check (ended_at is null or ended_at >= started_at);


-- Row level security: the dashboard talks to Supabase with the anon
-- key, so anon needs read + start + stop. Tighten these if you later
-- put the dashboard behind a login.

alter table public.class_sessions enable row level security;

drop policy if exists "anon reads sessions"  on public.class_sessions;
drop policy if exists "anon starts sessions" on public.class_sessions;
drop policy if exists "anon ends sessions"   on public.class_sessions;

create policy "anon reads sessions"
    on public.class_sessions
    for select
    to anon
    using (true);

create policy "anon starts sessions"
    on public.class_sessions
    for insert
    to anon
    with check (true);

create policy "anon ends sessions"
    on public.class_sessions
    for update
    to anon
    using (true)
    with check (true);
