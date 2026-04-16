-- Migration 002: Board Invitations
-- Supports inviting users to a board whether or not they have an account

CREATE TABLE board_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'member',
  token       VARCHAR(64)  UNIQUE NOT NULL,
  invited_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate pending invitations for the same email+board
CREATE UNIQUE INDEX idx_board_invitations_pending
  ON board_invitations(board_id, email)
  WHERE accepted_at IS NULL;

CREATE INDEX idx_board_invitations_token   ON board_invitations(token);
CREATE INDEX idx_board_invitations_board   ON board_invitations(board_id);
CREATE INDEX idx_board_invitations_email   ON board_invitations(email);
