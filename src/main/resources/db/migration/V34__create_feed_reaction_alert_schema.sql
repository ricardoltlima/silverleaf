create table feed_reaction_alert (
    id bigserial primary key,
    community_id bigint not null references community(id),
    recipient_user_id bigint not null references resident(id),
    actor_user_id bigint not null references resident(id),
    post_id bigint not null references community_post(id),
    reaction_type varchar(20) not null,
    created_at timestamptz not null default now(),
    last_reacted_at timestamptz not null default now(),
    read_at timestamptz null,
    constraint uk_feed_reaction_alert_recipient_actor_post unique (community_id, recipient_user_id, actor_user_id, post_id)
);

create index idx_feed_reaction_alert_recipient_community_last_reacted
    on feed_reaction_alert (recipient_user_id, community_id, last_reacted_at desc, id desc);

create index idx_feed_reaction_alert_post
    on feed_reaction_alert (post_id);
