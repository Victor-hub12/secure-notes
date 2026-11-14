create table if not exists public.notes (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  body text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  category text not null default 'projects' check (category in ('projects', 'business', 'personal')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes
  add column if not exists category text not null default 'personal'
  check (category in ('projects', 'business', 'personal'));
alter table public.notes
  add column if not exists project_id bigint references public.projects (id) on delete set null;
alter table public.notes
  add column if not exists tags text[] not null default '{}';

create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id bigint references public.projects (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  details text not null default '',
  tags text[] not null default '{}',
  due_date date,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id bigint references public.projects (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists tags text[] not null default '{}';
alter table public.tasks
  add column if not exists tags text[] not null default '{}';
alter table public.documents
  add column if not exists tags text[] not null default '{}';

create index if not exists notes_user_id_created_at on public.notes (user_id, created_at desc);
create index if not exists notes_project_id on public.notes (project_id);
create index if not exists notes_tags on public.notes using gin (tags);
create index if not exists projects_user_id_created_at on public.projects (user_id, created_at desc);
create index if not exists projects_tags on public.projects using gin (tags);
create index if not exists tasks_user_id_due_date on public.tasks (user_id, due_date);
create index if not exists tasks_project_id on public.tasks (project_id);
create index if not exists tasks_tags on public.tasks using gin (tags);
create index if not exists documents_user_id_created_at on public.documents (user_id, created_at desc);
create index if not exists documents_project_id on public.documents (project_id);
create index if not exists documents_tags on public.documents using gin (tags);

alter table public.notes enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;

grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

drop policy if exists "Users see their own notes" on public.notes;
create policy "Users see their own notes"
on public.notes for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users add notes as themselves" on public.notes;
create policy "Users add notes as themselves"
on public.notes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = notes.project_id and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users change their own notes" on public.notes;
create policy "Users change their own notes"
on public.notes for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = notes.project_id and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users delete their own notes" on public.notes;
create policy "Users delete their own notes"
on public.notes for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users see their own projects" on public.projects;
create policy "Users see their own projects"
on public.projects for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users add their own projects" on public.projects;
create policy "Users add their own projects"
on public.projects for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users change their own projects" on public.projects;
create policy "Users change their own projects"
on public.projects for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users delete their own projects" on public.projects;
create policy "Users delete their own projects"
on public.projects for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users see their own tasks" on public.tasks;
create policy "Users see their own tasks"
on public.tasks for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users add their own tasks" on public.tasks;
create policy "Users add their own tasks"
on public.tasks for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = tasks.project_id and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users change their own tasks" on public.tasks;
create policy "Users change their own tasks"
on public.tasks for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = tasks.project_id and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users delete their own tasks" on public.tasks;
create policy "Users delete their own tasks"
on public.tasks for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users see their own documents" on public.documents;
create policy "Users see their own documents"
on public.documents for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users add their own documents" on public.documents;
create policy "Users add their own documents"
on public.documents for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = documents.project_id and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users change their own documents" on public.documents;
create policy "Users change their own documents"
on public.documents for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = documents.project_id and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users delete their own documents" on public.documents;
create policy "Users delete their own documents"
on public.documents for delete to authenticated
using (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
