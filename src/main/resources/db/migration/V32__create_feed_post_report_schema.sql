create table if not exists feed_post_report (
    id bigserial primary key,
    community_id bigint not null references community(id) on delete cascade,
    post_id bigint not null references community_post(id) on delete cascade,
    reporter_user_id bigint not null references resident(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint uq_feed_post_report_post_reporter unique (post_id, reporter_user_id)
);

create index if not exists idx_feed_post_report_community_created_at
    on feed_post_report (community_id, created_at desc, id desc);

create index if not exists idx_feed_post_report_post
    on feed_post_report (post_id);
