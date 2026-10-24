-- Courses: top-level containers with access control
create table public.courses (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  subtitle      text,
  description   text,
  thumbnail_url text,
  bunny_library_id text,       -- Bunny Stream library that holds this course's videos
  is_published  boolean not null default true,
  requires_access boolean not null default true,  -- false = all members can watch
  order_index   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Videos within courses (sourced from Bunny Stream)
create table public.course_videos (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses(id) on delete cascade,
  title            text not null,
  description      text,
  bunny_video_id   text not null,   -- Bunny Stream video GUID
  duration_seconds integer not null default 0,
  thumbnail_url    text,
  is_published     boolean not null default true,
  order_index      integer not null default 0,
  created_at       timestamptz not null default now()
);

-- Per-user course access grants
create table public.user_course_access (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references auth.users(id),
  expires_at  timestamptz,   -- null = lifetime access
  unique (user_id, course_id)
);

-- Indexes for common lookups
create index on public.course_videos(course_id, order_index);
create index on public.user_course_access(user_id);
create index on public.user_course_access(course_id);

-- RLS
alter table public.courses           enable row level security;
alter table public.course_videos     enable row level security;
alter table public.user_course_access enable row level security;

-- Courses: any authenticated user can read published courses
create policy "courses_read" on public.courses
  for select to authenticated
  using (is_published = true);

-- Course videos: any authenticated user can read (access check is in API layer)
create policy "course_videos_read" on public.course_videos
  for select to authenticated
  using (is_published = true);

-- Access grants: users see only their own; service role sees all
create policy "access_self_read" on public.user_course_access
  for select to authenticated
  using (user_id = auth.uid());

-- Seed the three initial courses
insert into public.courses (slug, title, subtitle, description, bunny_library_id, is_published, requires_access, order_index)
values
  ('4444-journey',
   'The 4444 Journey',
   'A 44-day transformational path',
   'A guided 44-day process combining psychedelic integration, somatic practices, and deep inner work to activate your highest self.',
   null,   -- will be set once Bunny Stream library ID is confirmed
   true, true, 1),

  ('222-journey',
   'The 222 Journey',
   'A 22-day initiation',
   'An intensive 22-day initiation into the Journeymen Collective methodology — the foundation for every transformation that follows.',
   null,
   true, true, 2),

  ('vision-creation',
   'Vision Video Creation',
   'Craft your definitive vision',
   'The complete process for creating a powerful, cinematic vision video that encodes your future self and activates daily alignment.',
   null,
   true, true, 3);
