alter table resident_group add column if not exists community_id bigint;

update resident_group
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;

alter table resident_group alter column community_id set not null;

alter table resident_group
    add constraint fk_resident_group_community
    foreign key (community_id) references community(id);

create index if not exists idx_resident_group_community_name
    on resident_group(community_id, name, id desc);

alter table community_post add column if not exists community_id bigint;

update community_post
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;

alter table community_post alter column community_id set not null;

alter table community_post
    add constraint fk_community_post_community
    foreign key (community_id) references community(id);

create index if not exists idx_community_post_community_channel_created
    on community_post(community_id, channel, created_at desc, id desc);

create index if not exists idx_community_post_community_group_created
    on community_post(community_id, group_slug, created_at desc, id desc);
