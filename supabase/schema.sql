-- Run this whole file in Supabase > SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric(12,2) not null check (price >= 0),
  email text not null,
  category text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_created_idx on public.listings(created_at desc);

-- No login required, so anonymous visitors get limited access.
alter table public.listings enable row level security;
alter table public.messages enable row level security;

drop policy if exists "listings readable" on public.listings;
drop policy if exists "listings insertable" on public.listings;
create policy "listings readable" on public.listings for select using (true);
create policy "listings insertable" on public.listings for insert with check (true);

-- Buyers can write messages but not read other people's messages.
drop policy if exists "messages insertable" on public.messages;
create policy "messages insertable" on public.messages for insert with check (true);

-- Public image bucket
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "images public read" on storage.objects;
drop policy if exists "images public upload" on storage.objects;
create policy "images public read" on storage.objects
  for select using (bucket_id = 'listing-images');
create policy "images public upload" on storage.objects
  for insert with check (bucket_id = 'listing-images');
