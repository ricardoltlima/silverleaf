create table if not exists resident_community_membership (
    id bigserial primary key,
    resident_id bigint not null references resident(id) on delete cascade,
    community_id bigint not null references community(id) on delete cascade,
    active boolean not null default true,
    joined_at timestamptz not null default now(),
    left_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uk_resident_community_membership unique (resident_id, community_id)
);

insert into resident_community_membership (resident_id, community_id, active, joined_at)
select distinct hm.resident_id, h.community_id, true, coalesce(hm.moved_in_at, now())
from household_membership hm
join house h on h.id = hm.house_id
where hm.active = true
  and not exists (
      select 1
      from resident_community_membership rcm
      where rcm.resident_id = hm.resident_id
        and rcm.community_id = h.community_id
  );

insert into resident_community_membership (resident_id, community_id, active, joined_at)
select r.id, c.id, true, now()
from resident r
cross join community c
where c.slug = 'silverleaf-reserve'
  and not exists (
      select 1
      from resident_community_membership rcm
      where rcm.resident_id = r.id
  );

update resident_community_membership rcm
set active = false,
    left_at = now()
where active = true
  and exists (
      select 1
      from resident_community_membership other
      where other.resident_id = rcm.resident_id
        and other.active = true
        and other.id <> rcm.id
        and other.joined_at > rcm.joined_at
  );

create index if not exists idx_resident_community_membership_resident_active
    on resident_community_membership(resident_id, active, updated_at desc, id desc);

create index if not exists idx_resident_community_membership_community_active
    on resident_community_membership(community_id, active, resident_id);
