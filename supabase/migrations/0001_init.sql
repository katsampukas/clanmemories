-- ClanMemories initial schema
-- Photos live in Google Drive; this schema stores metadata, tags, people, and comments.

create extension if not exists "pgcrypto";

-- Emails allowed to sign in and use the app.
create table if not exists allowed_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

-- People who can be tagged in photos (e.g. "Γιαγιά Μαργαρίτα").
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

-- Free-form hashtags (e.g. #γάμος, #χριστούγεννα, #δεκαετία-70).
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- One row per photo stored in the shared Google Drive folder.
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text not null unique,
  filename text not null,
  description text,
  event_name text,
  occurred_on date,
  occurred_period text, -- freeform, e.g. "δεκαετία του '70" when exact date is unknown
  location text,
  uploaded_by text references allowed_emails(email),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists photo_people (
  photo_id uuid not null references photos(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  primary key (photo_id, person_id)
);

create table if not exists photo_tags (
  photo_id uuid not null references photos(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (photo_id, tag_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  author_email text not null references allowed_emails(email),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists photos_occurred_on_idx on photos (occurred_on);
create index if not exists comments_photo_id_idx on comments (photo_id);

-- Keep updated_at fresh.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists photos_set_updated_at on photos;
create trigger photos_set_updated_at
  before update on photos
  for each row execute function set_updated_at();

-- Row Level Security: only signed-in users whose email is in allowed_emails may read/write.
alter table allowed_emails enable row level security;
alter table people enable row level security;
alter table tags enable row level security;
alter table photos enable row level security;
alter table photo_people enable row level security;
alter table photo_tags enable row level security;
alter table comments enable row level security;

create or replace function is_allowed_user()
returns boolean as $$
  select exists (
    select 1 from allowed_emails
    where email = auth.jwt() ->> 'email'
  );
$$ language sql stable security definer;

create policy "allowed users can read allowed_emails" on allowed_emails
  for select using (is_allowed_user());

create policy "allowed users can read people" on people
  for select using (is_allowed_user());
create policy "allowed users can write people" on people
  for insert with check (is_allowed_user());
create policy "allowed users can update people" on people
  for update using (is_allowed_user());

create policy "allowed users can read tags" on tags
  for select using (is_allowed_user());
create policy "allowed users can write tags" on tags
  for insert with check (is_allowed_user());

create policy "allowed users can read photos" on photos
  for select using (is_allowed_user());
create policy "allowed users can insert photos" on photos
  for insert with check (is_allowed_user());
create policy "allowed users can update photos" on photos
  for update using (is_allowed_user());

create policy "allowed users can read photo_people" on photo_people
  for select using (is_allowed_user());
create policy "allowed users can write photo_people" on photo_people
  for insert with check (is_allowed_user());
create policy "allowed users can delete photo_people" on photo_people
  for delete using (is_allowed_user());

create policy "allowed users can read photo_tags" on photo_tags
  for select using (is_allowed_user());
create policy "allowed users can write photo_tags" on photo_tags
  for insert with check (is_allowed_user());
create policy "allowed users can delete photo_tags" on photo_tags
  for delete using (is_allowed_user());

create policy "allowed users can read comments" on comments
  for select using (is_allowed_user());
create policy "allowed users can insert comments" on comments
  for insert with check (is_allowed_user() and author_email = auth.jwt() ->> 'email');
