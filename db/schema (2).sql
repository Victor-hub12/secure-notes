create table notes (
id bigint generated always as identity primary key,
user_id uuid not null default auth.uid() references auth.users (id) on 
delete cascade,
title text not null check (length(trim(title)) > 0),
body text not null default '',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);
create index notes_user_id_created_at on notes (user_id, created_at desc);
alter table notes enable row level security;
grant select, insert, update, delete on notes to authenticated;
create policy "Users see their own notes"
on notes for select to authenticated
using (user_id = (select auth.uid()));
create policy "Users add notes as themselves"
on notes for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "Users change their own notes"
on notes for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "Users delete their own notes"
on notes for delete to authenticated
using (user_id = (select auth.uid()));