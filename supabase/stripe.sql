-- Run in Supabase > SQL Editor AFTER schema.sql (Test 3).

alter table public.listings add column if not exists sold boolean not null default false;

-- One row per seller, keyed by the email used on their listings.
create table if not exists public.sellers (
  email text primary key,
  stripe_account_id text not null unique,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  listing_id uuid not null references public.listings(id),
  seller_account_id text not null,
  buyer_email text,
  amount_total integer not null,      -- cents
  platform_fee integer not null,      -- cents
  currency text not null default 'usd',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

-- Locked down: no policies for anon. Only the server (service role key) can read/write these.
alter table public.sellers enable row level security;
alter table public.orders enable row level security;
