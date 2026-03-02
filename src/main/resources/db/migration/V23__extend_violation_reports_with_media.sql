ALTER TABLE violation_report
    ADD COLUMN IF NOT EXISTS media_urls_text text;
