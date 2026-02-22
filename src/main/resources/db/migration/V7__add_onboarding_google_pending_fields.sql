ALTER TABLE onboarding_session
ADD COLUMN pending_provider VARCHAR(30),
ADD COLUMN pending_subject VARCHAR(255),
ADD COLUMN pending_full_name VARCHAR(120),
ADD COLUMN pending_email VARCHAR(320);
