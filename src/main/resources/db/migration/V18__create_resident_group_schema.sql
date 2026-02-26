create table if not exists resident_group (
    id bigserial primary key,
    slug varchar(120) not null unique,
    name varchar(120) not null,
    description varchar(500),
    visibility varchar(20) not null,
    owner_user_id bigint not null references resident(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_resident_group_visibility on resident_group(visibility, id desc);
create index if not exists idx_resident_group_owner on resident_group(owner_user_id);

create table if not exists resident_group_member (
    id bigserial primary key,
    group_id bigint not null references resident_group(id) on delete cascade,
    user_id bigint not null references resident(id) on delete cascade,
    joined_at timestamptz not null default now(),
    constraint uk_resident_group_member unique (group_id, user_id)
);

create index if not exists idx_resident_group_member_user on resident_group_member(user_id, group_id);
