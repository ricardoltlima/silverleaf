create table if not exists community (
    id bigserial primary key,
    slug varchar(120) not null unique,
    name varchar(160) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into community (slug, name)
select 'silverleaf-reserve', 'Silverleaf Reserve'
where not exists (
    select 1 from community where slug = 'silverleaf-reserve'
);

alter table house add column if not exists community_id bigint;

update house
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;

alter table house alter column community_id set not null;

alter table house
    add constraint fk_house_community
    foreign key (community_id) references community(id);

create index if not exists idx_house_community_address
    on house(community_id, address);
