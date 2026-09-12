create table quotations (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  supplier_id uuid not null references users(id) on delete cascade,
  price numeric(12,2) not null check (price > 0),
  delivery_time varchar(100) not null,
  message text,
  status varchar(10) not null default 'open' check (status in ('open', 'accepted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rfq_id, supplier_id)   -- one supplier can quote once per RFQ
);


create index idx_quotations_rfq_id on quotations(rfq_id);
create index idx_quotations_supplier_id on quotations(supplier_id);
create index idx_quotations_status on quotations(status);