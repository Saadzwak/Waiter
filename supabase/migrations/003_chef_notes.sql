-- Drop existing function first (return type changed)
drop function if exists match_menu_items(vector,uuid,integer);

-- Add chef_notes to menu_items
alter table public.menu_items
  add column if not exists chef_notes text;

-- Recreate match_menu_items with chef_notes included
create function match_menu_items(
  query_embedding vector(1536),
  match_restaurant_id uuid,
  match_count int default 6
)
returns table (
  id uuid,
  name text,
  description text,
  price numeric,
  currency text,
  tags text[],
  allergens text[],
  pairing_suggestions text[],
  chef_notes text,
  similarity float
)
language sql
stable
as $$
  select
    id,
    name,
    description,
    price,
    currency,
    tags,
    allergens,
    pairing_suggestions,
    chef_notes,
    1 - (embedding <=> query_embedding) as similarity
  from public.menu_items
  where restaurant_id = match_restaurant_id
    and available = true
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
