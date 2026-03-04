alter table silverleaf_news add column if not exists community_id bigint;
update silverleaf_news
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;
alter table silverleaf_news alter column community_id set not null;
alter table silverleaf_news
    add constraint fk_silverleaf_news_community
    foreign key (community_id) references community(id);
create index if not exists idx_silverleaf_news_community_created
    on silverleaf_news(community_id, created_at desc, id desc);

alter table board_broadcast add column if not exists community_id bigint;
update board_broadcast
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;
alter table board_broadcast alter column community_id set not null;
alter table board_broadcast
    add constraint fk_board_broadcast_community
    foreign key (community_id) references community(id);
create index if not exists idx_board_broadcast_community_created
    on board_broadcast(community_id, created_at desc, id desc);

alter table board_poll add column if not exists community_id bigint;
update board_poll
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;
alter table board_poll alter column community_id set not null;
alter table board_poll
    add constraint fk_board_poll_community
    foreign key (community_id) references community(id);
create index if not exists idx_board_poll_community_created
    on board_poll(community_id, created_at desc, id desc);

alter table violation_report add column if not exists community_id bigint;
update violation_report
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;
alter table violation_report alter column community_id set not null;
alter table violation_report
    add constraint fk_violation_report_community
    foreign key (community_id) references community(id);
create index if not exists idx_violation_report_community_created
    on violation_report(community_id, created_at desc, id desc);

alter table garage_sale_item add column if not exists community_id bigint;
update garage_sale_item
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;
alter table garage_sale_item alter column community_id set not null;
alter table garage_sale_item
    add constraint fk_garage_sale_item_community
    foreign key (community_id) references community(id);
create index if not exists idx_garage_sale_item_community_created
    on garage_sale_item(community_id, created_at desc, id desc);

alter table direct_message add column if not exists community_id bigint;
update direct_message
set community_id = (select id from community where slug = 'silverleaf-reserve')
where community_id is null;
alter table direct_message alter column community_id set not null;
alter table direct_message
    add constraint fk_direct_message_community
    foreign key (community_id) references community(id);
create index if not exists idx_direct_message_community_recipient_unread
    on direct_message(community_id, recipient_user_id, read_at, created_at desc, id desc);
