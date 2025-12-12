-- Migration: 002_make_school_id_nullable
-- Created: 2024-12-12
-- Description: Make school_id nullable in users table to support two-step registration

ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;
