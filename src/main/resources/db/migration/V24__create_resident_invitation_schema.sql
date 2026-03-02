CREATE TABLE IF NOT EXISTS resident_invitation (
    id BIGSERIAL PRIMARY KEY,
    resident_id BIGINT NOT NULL REFERENCES resident(id),
    house_id BIGINT NOT NULL REFERENCES house(id),
    invited_by_user_id BIGINT NOT NULL REFERENCES resident(id),
    invitation_token VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
