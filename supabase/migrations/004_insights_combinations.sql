-- INSIGHTS: stores nightly AI analysis per restaurant
create table public.insights (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references public.restaurants(id) on delete cascade not null,
  analysis_date  date not null,
  period         text not null default 'daily',
  event_count    int not null default 0,
  analysis       jsonb not null,
  created_at     timestamptz default now() not null,
  unique(restaurant_id, analysis_date, period)
);
alter table public.insights enable row level security;
create policy "owner_all" on public.insights
  for all using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

-- MEAL COMBINATIONS: GPT-proposed combos, validated by restaurateur
create table public.meal_combinations (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references public.restaurants(id) on delete cascade not null,
  name           text not null,
  description    text,
  item_ids       uuid[] not null default '{}',
  item_names     text[] not null default '{}',
  validated      boolean not null default false,
  created_at     timestamptz default now() not null
);
alter table public.meal_combinations enable row level security;
create policy "owner_all" on public.meal_combinations
  for all using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));
