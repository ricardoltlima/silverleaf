alter table silverleaf_news
    add column if not exists media_urls_text text,
    add column if not exists updated_at timestamptz not null default now();

