create table if not exists garage_sale_item (
    id bigserial primary key,
    seller_user_id bigint not null references resident(id) on delete cascade,
    title varchar(180) not null,
    price_label varchar(60) not null,
    condition_label varchar(80) not null,
    category varchar(80) not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_garage_sale_item_created_at on garage_sale_item(created_at desc, id desc);
create index if not exists idx_garage_sale_item_seller on garage_sale_item(seller_user_id);

create table if not exists garage_sale_item_media (
    id bigserial primary key,
    item_id bigint not null references garage_sale_item(id) on delete cascade,
    media_type varchar(20) not null,
    media_url varchar(500) not null,
    sort_order int not null default 0
);

create index if not exists idx_garage_sale_item_media_item on garage_sale_item_media(item_id, sort_order, id);
