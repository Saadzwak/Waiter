-- Vector similarity search function for RAG
create or replace function match_menu_items(
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
    1 - (embedding <=> query_embedding) as similarity
  from public.menu_items
  where restaurant_id = match_restaurant_id
    and available = true
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
