create table if not exists feed_comment_report (
    id bigserial primary key,
    community_id bigint not null references community(id) on delete cascade,
    comment_id bigint not null references community_post_comment(id) on delete cascade,
    reporter_user_id bigint not null references resident(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint uq_feed_comment_report_comment_reporter unique (comment_id, reporter_user_id)
);

create index if not exists idx_feed_comment_report_community_created_at
    on feed_comment_report (community_id, created_at desc, id desc);

create index if not exists idx_feed_comment_report_comment
    on feed_comment_report (comment_id);
