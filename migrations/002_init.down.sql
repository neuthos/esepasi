-- Rollback migration: 002_make_school_id_nullable

ALTER TABLE users ALTER COLUMN school_id SET NOT NULL;
