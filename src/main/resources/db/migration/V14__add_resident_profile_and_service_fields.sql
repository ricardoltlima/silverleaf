alter table resident
    add column if not exists phone_number varchar(40),
    add column if not exists service_enabled boolean not null default false,
    add column if not exists service_title varchar(140),
    add column if not exists service_description text,
    add column if not exists service_contact_phone varchar(40),
    add column if not exists service_contact_email varchar(320),
    add column if not exists service_business_url varchar(500),
    add column if not exists service_hours varchar(160),
    add column if not exists service_area varchar(160),
    add column if not exists service_visibility varchar(30) not null default 'PUBLIC';
