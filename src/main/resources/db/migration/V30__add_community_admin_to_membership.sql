alter table resident_community_membership
    add column if not exists community_admin boolean not null default false;

update resident_community_membership membership
set community_admin = true
from resident
where resident.id = membership.resident_id
  and resident.role in ('HOA_ADMIN', 'ADMIN');
