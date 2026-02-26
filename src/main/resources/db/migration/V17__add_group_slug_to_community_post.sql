alter table community_post
    add column if not exists group_slug varchar(80);

create index if not exists idx_community_post_channel_group_slug_created
    on community_post(channel, group_slug, created_at desc, id desc);
