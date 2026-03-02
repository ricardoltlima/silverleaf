create table if not exists silverleaf_news (
    id bigserial primary key,
    title varchar(180) not null,
    body_text text not null,
    author_user_id bigint not null references resident(id) on delete cascade,
    created_at timestamptz not null default now()
);

create index if not exists idx_silverleaf_news_created_at
    on silverleaf_news(created_at desc, id desc);

create table if not exists violation_report (
    id bigserial primary key,
    reporter_user_id bigint not null references resident(id) on delete cascade,
    description text not null,
    photo_url varchar(500),
    status varchar(30) not null default 'OPEN',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_violation_report_status_created
    on violation_report(status, created_at desc, id desc);

create table if not exists board_broadcast (
    id bigserial primary key,
    title varchar(180) not null,
    body_text text not null,
    author_user_id bigint not null references resident(id) on delete cascade,
    created_at timestamptz not null default now()
);

create index if not exists idx_board_broadcast_created_at
    on board_broadcast(created_at desc, id desc);

create table if not exists board_poll (
    id bigserial primary key,
    question varchar(300) not null,
    options_text text not null,
    active boolean not null default true,
    author_user_id bigint not null references resident(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists board_poll_vote (
    id bigserial primary key,
    poll_id bigint not null references board_poll(id) on delete cascade,
    voter_user_id bigint not null references resident(id) on delete cascade,
    option_index int not null,
    created_at timestamptz not null default now(),
    constraint uk_board_poll_vote unique (poll_id, voter_user_id)
);

create index if not exists idx_board_poll_vote_poll on board_poll_vote(poll_id);
