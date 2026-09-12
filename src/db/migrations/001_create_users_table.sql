create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(180) not null unique,
  password_hash text not null,
  role varchar(10) not null check (role in ('buyer', 'supplier')),
  company_name varchar(150),
  created_at timestamptz not null default now()
);