create table if not exists resident_group_join_request (
    id bigserial primary key,
    group_id bigint not null references resident_group(id) on delete cascade,
    requester_user_id bigint not null references resident(id) on delete cascade,
    status varchar(20) not null,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    constraint uk_resident_group_join_request unique (group_id, requester_user_id)
);

create index if not exists idx_resident_group_join_request_group
    on resident_group_join_request(group_id, status, created_at desc);

create index if not exists idx_resident_group_join_request_requester
    on resident_group_join_request(requester_user_id, status, created_at desc);
