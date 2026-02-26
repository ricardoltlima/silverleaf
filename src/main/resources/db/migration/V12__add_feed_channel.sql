ALTER TABLE community_post
    ADD COLUMN IF NOT EXISTS channel VARCHAR(30) NOT NULL DEFAULT 'COMMUNITY';

CREATE INDEX IF NOT EXISTS idx_community_post_channel_created_id
    ON community_post (channel, created_at DESC, id DESC);
