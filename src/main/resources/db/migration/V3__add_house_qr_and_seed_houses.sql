ALTER TABLE house
ADD COLUMN qr_token VARCHAR(64);

UPDATE house
SET qr_token = md5(address || ':' || id::text)
WHERE qr_token IS NULL;

ALTER TABLE house
ALTER COLUMN qr_token SET NOT NULL;

ALTER TABLE house
ADD CONSTRAINT uk_house_qr_token UNIQUE (qr_token);

INSERT INTO house (address, qr_token, status)
VALUES
    ('001 Silverleaf Lane', 'house-001-qr-token', 'PENDING'),
    ('002 Silverleaf Lane', 'house-002-qr-token', 'PENDING'),
    ('003 Silverleaf Lane', 'house-003-qr-token', 'PENDING'),
    ('004 Silverleaf Lane', 'house-004-qr-token', 'PENDING'),
    ('005 Silverleaf Lane', 'house-005-qr-token', 'PENDING'),
    ('006 Silverleaf Lane', 'house-006-qr-token', 'PENDING'),
    ('007 Silverleaf Lane', 'house-007-qr-token', 'PENDING'),
    ('008 Silverleaf Lane', 'house-008-qr-token', 'PENDING'),
    ('009 Silverleaf Lane', 'house-009-qr-token', 'PENDING'),
    ('010 Silverleaf Lane', 'house-010-qr-token', 'PENDING'),
    ('011 Silverleaf Lane', 'house-011-qr-token', 'PENDING'),
    ('012 Silverleaf Lane', 'house-012-qr-token', 'PENDING'),
    ('013 Silverleaf Lane', 'house-013-qr-token', 'PENDING'),
    ('014 Silverleaf Lane', 'house-014-qr-token', 'PENDING'),
    ('015 Silverleaf Lane', 'house-015-qr-token', 'PENDING'),
    ('016 Silverleaf Lane', 'house-016-qr-token', 'PENDING'),
    ('017 Silverleaf Lane', 'house-017-qr-token', 'PENDING'),
    ('018 Silverleaf Lane', 'house-018-qr-token', 'PENDING'),
    ('019 Silverleaf Lane', 'house-019-qr-token', 'PENDING'),
    ('020 Silverleaf Lane', 'house-020-qr-token', 'PENDING'),
    ('021 Silverleaf Lane', 'house-021-qr-token', 'PENDING'),
    ('022 Silverleaf Lane', 'house-022-qr-token', 'PENDING'),
    ('023 Silverleaf Lane', 'house-023-qr-token', 'PENDING'),
    ('024 Silverleaf Lane', 'house-024-qr-token', 'PENDING'),
    ('025 Silverleaf Lane', 'house-025-qr-token', 'PENDING'),
    ('026 Silverleaf Lane', 'house-026-qr-token', 'PENDING'),
    ('027 Silverleaf Lane', 'house-027-qr-token', 'PENDING'),
    ('028 Silverleaf Lane', 'house-028-qr-token', 'PENDING'),
    ('029 Silverleaf Lane', 'house-029-qr-token', 'PENDING'),
    ('030 Silverleaf Lane', 'house-030-qr-token', 'PENDING'),
    ('031 Silverleaf Lane', 'house-031-qr-token', 'PENDING'),
    ('032 Silverleaf Lane', 'house-032-qr-token', 'PENDING'),
    ('033 Silverleaf Lane', 'house-033-qr-token', 'PENDING'),
    ('034 Silverleaf Lane', 'house-034-qr-token', 'PENDING'),
    ('035 Silverleaf Lane', 'house-035-qr-token', 'PENDING'),
    ('036 Silverleaf Lane', 'house-036-qr-token', 'PENDING'),
    ('037 Silverleaf Lane', 'house-037-qr-token', 'PENDING'),
    ('038 Silverleaf Lane', 'house-038-qr-token', 'PENDING'),
    ('039 Silverleaf Lane', 'house-039-qr-token', 'PENDING'),
    ('040 Silverleaf Lane', 'house-040-qr-token', 'PENDING'),
    ('041 Silverleaf Lane', 'house-041-qr-token', 'PENDING'),
    ('042 Silverleaf Lane', 'house-042-qr-token', 'PENDING'),
    ('043 Silverleaf Lane', 'house-043-qr-token', 'PENDING'),
    ('044 Silverleaf Lane', 'house-044-qr-token', 'PENDING'),
    ('045 Silverleaf Lane', 'house-045-qr-token', 'PENDING'),
    ('046 Silverleaf Lane', 'house-046-qr-token', 'PENDING'),
    ('047 Silverleaf Lane', 'house-047-qr-token', 'PENDING'),
    ('048 Silverleaf Lane', 'house-048-qr-token', 'PENDING'),
    ('049 Silverleaf Lane', 'house-049-qr-token', 'PENDING'),
    ('050 Silverleaf Lane', 'house-050-qr-token', 'PENDING')
ON CONFLICT (address) DO NOTHING;
