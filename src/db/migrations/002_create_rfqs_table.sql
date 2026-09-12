create table rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users(id) on delete cascade,
  product_name varchar(200) not null,
  description text not null,
  quantity integer not null check (quantity > 0),
  delivery_location varchar(200) not null,
  deadline date not null,
  status varchar(10) not null default 'open' check (status in ('open', 'closed', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rfqs_buyer_id on rfqs(buyer_id);
create index idx_rfqs_status on rfqs(status);