-- Enable pgvector for embeddings
create extension if not exists vector;

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table public.restaurants (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users(id) on delete cascade not null,
  slug            text unique not null,
  name            text not null,
  description     text,
  logo_url        text,
  language_default text not null default 'en',
  created_at      timestamptz default now() not null
);

alter table public.restaurants enable row level security;

-- Owner can read/write their own restaurant
create policy "owner_all" on public.restaurants
  for all using (auth.uid() = owner_id);

-- Public can read by slug (needed for the chat page)
create policy "public_read_by_slug" on public.restaurants
  for select using (true);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
create table public.menu_categories (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid references public.restaurants(id) on delete cascade not null,
  name            text not null,
  position        integer not null default 0,
  created_at      timestamptz default now() not null
);

alter table public.menu_categories enable row level security;

create policy "owner_all" on public.menu_categories
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "public_read" on public.menu_categories
  for select using (true);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table public.menu_items (
  id                  uuid primary key default gen_random_uuid(),
  restaurant_id       uuid references public.restaurants(id) on delete cascade not null,
  category_id         uuid references public.menu_categories(id) on delete set null,
  name                text not null,
  description         text,
  price               numeric(10, 2),
  currency            text not null default 'EUR',
  tags                text[] not null default '{}',
  allergens           text[] not null default '{}',
  pairing_suggestions text[] not null default '{}',
  image_url           text,
  available           boolean not null default true,
  embedding           vector(1536),
  created_at          timestamptz default now() not null
);

alter table public.menu_items enable row level security;

create policy "owner_all" on public.menu_items
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "public_read" on public.menu_items
  for select using (true);

-- Index for fast vector similarity search
create index menu_items_embedding_idx
  on public.menu_items
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
create table public.chat_sessions (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid references public.restaurants(id) on delete cascade not null,
  language_detected text,
  created_at        timestamptz default now() not null
);

alter table public.chat_sessions enable row level security;

-- Public can insert (no auth needed for customers)
create policy "public_insert" on public.chat_sessions
  for insert with check (true);

-- Owner can read their restaurant's sessions
create policy "owner_read" on public.chat_sessions
  for select using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references public.chat_sessions(id) on delete cascade not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "public_insert" on public.chat_messages
  for insert with check (true);

create policy "owner_read" on public.chat_messages
  for select using (
    exists (
      select 1
      from public.chat_sessions cs
      join public.restaurants r on r.id = cs.restaurant_id
      where cs.id = session_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- EVENTS (analytics)
-- ============================================================
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  session_id    uuid references public.chat_sessions(id) on delete cascade,
  event         text not null,
  properties    jsonb,
  created_at    timestamptz default now() not null
);

alter table public.events enable row level security;

create policy "public_insert" on public.events
  for insert with check (true);

create policy "owner_read" on public.events
  for select using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- MENU INGESTION JOBS (track upload status)
-- ============================================================
create table public.ingestion_jobs (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  file_url      text not null,
  file_type     text not null check (file_type in ('pdf', 'image')),
  status        text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  error_message text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.ingestion_jobs enable row level security;

create policy "owner_all" on public.ingestion_jobs
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );
