-- Contact form leads
create table if not exists contact_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text,
  created_at  timestamptz default now()
);

-- RLS: enable, allow public inserts only, no public reads
alter table contact_leads enable row level security;

create policy "public_insert_contact"
  on contact_leads for insert
  to anon, authenticated
  with check (true);
-- No SELECT policy → only service_role (your Server Action) can read rows
