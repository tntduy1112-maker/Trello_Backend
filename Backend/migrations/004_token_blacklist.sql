-- Migration 004: Token blacklist + mass revocation support

-- Individual access token blacklist (logout, admin revoke)
CREATE TABLE token_blacklist (
  jti        VARCHAR(36) PRIMARY KEY,          -- UUID from JWT jti claim
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason     VARCHAR(30) NOT NULL,             -- logout | reuse_detected | admin_revoke
  expires_at TIMESTAMPTZ NOT NULL,             -- mirrors token exp — used for cleanup
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleanup index: periodic DELETE WHERE expires_at < NOW()
CREATE INDEX idx_blacklist_expires ON token_blacklist(expires_at);

-- Mass revocation: any token issued before this timestamp is invalid
ALTER TABLE users ADD COLUMN tokens_valid_after TIMESTAMPTZ;
