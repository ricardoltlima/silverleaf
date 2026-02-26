create table if not exists direct_message (
    id bigserial primary key,
    sender_user_id bigint not null references resident(id) on delete cascade,
    recipient_user_id bigint not null references resident(id) on delete cascade,
    body_text text not null,
    created_at timestamptz not null default now(),
    read_at timestamptz
);

create index if not exists idx_direct_message_sender_created
    on direct_message(sender_user_id, created_at desc, id desc);

create index if not exists idx_direct_message_recipient_created
    on direct_message(recipient_user_id, created_at desc, id desc);

create index if not exists idx_direct_message_unread
    on direct_message(recipient_user_id, read_at)
    where read_at is null;
