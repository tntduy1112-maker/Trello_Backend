-- Migration 003: Hash refresh tokens before storing in DB
-- Renames token → token_hash (VARCHAR 64 = SHA-256 hex output)
-- Invalidates all existing sessions (cannot retroactively hash raw JWTs)

-- Wipe existing raw-token rows first (before type change, to avoid value-too-long error)
DELETE FROM refresh_tokens;

ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
ALTER TABLE refresh_tokens ALTER COLUMN token_hash TYPE VARCHAR(64);

-- Re-index on the new column name
DROP INDEX IF EXISTS idx_refresh_tokens_token;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
