ALTER TABLE resident
    ADD COLUMN IF NOT EXISTS address_visible boolean NOT NULL DEFAULT false;
