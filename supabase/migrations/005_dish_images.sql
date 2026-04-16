-- Dish images in chat: the RAG match function now needs to return
-- the item id and image_url so the customer-facing chat can render
-- rich dish cards inline with the AI's recommendations.
--
-- Storage: create a public bucket `dish-images` with the same policies as
-- `menu-uploads` (owner-write, public-read). Because Supabase Storage
-- policies live in a separate schema, do it via the dashboard or add here
-- if your migration tooling supports it.

-- Drop existing function first (return type changed)
drop function if exists match_menu_items(vector, uuid, integer);

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
  image_url text,
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
    image_url,
    1 - (embedding <=> query_embedding) as similarity
  from public.menu_items
  where restaurant_id = match_restaurant_id
    and available = true
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- Storage bucket for individual dish images (auto-cropped from menu photos
-- or uploaded manually by the owner).
--
-- Run this via the Supabase dashboard if your local migration tool skips
-- the storage schema:
--
--   insert into storage.buckets (id, name, public)
--   values ('dish-images', 'dish-images', true)
--   on conflict (id) do nothing;
--
--   create policy "public_read_dish_images"
--     on storage.objects for select
--     using (bucket_id = 'dish-images');
--
--   create policy "authenticated_write_dish_images"
--     on storage.objects for insert
--     to authenticated
--     with check (bucket_id = 'dish-images');
--
--   create policy "service_role_write_dish_images"
--     on storage.objects for insert
--     to service_role
--     with check (bucket_id = 'dish-images');
-- ──────────────────────────────────────────────────────────────────────────
