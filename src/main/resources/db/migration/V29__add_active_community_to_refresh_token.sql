alter table refresh_token add column if not exists active_community_id bigint;

update refresh_token
set active_community_id = (select id from community where slug = 'silverleaf-reserve')
where active_community_id is null;

alter table refresh_token alter column active_community_id set not null;

alter table refresh_token
    add constraint fk_refresh_token_active_community
    foreign key (active_community_id) references community(id);

create index if not exists idx_refresh_token_active_community
    on refresh_token(active_community_id, user_id, expires_at desc);
