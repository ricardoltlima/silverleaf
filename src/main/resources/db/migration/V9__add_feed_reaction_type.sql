ALTER TABLE community_post_like ADD COLUMN reaction_type VARCHAR(16);

UPDATE community_post_like
SET reaction_type = 'HEART'
WHERE reaction_type IS NULL;

ALTER TABLE community_post_like
ALTER COLUMN reaction_type SET NOT NULL;

CREATE INDEX idx_community_post_like_post_reaction
    ON community_post_like(post_id, reaction_type);
