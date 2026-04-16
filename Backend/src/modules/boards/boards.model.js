const { query } = require('../../configs/postgres');

const createBoard = async (organizationId, name, description, coverColor, coverImageUrl, visibility, createdBy) => {
  const result = await query(
    `INSERT INTO boards (organization_id, name, description, cover_color, cover_image_url, visibility, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [organizationId, name, description || null, coverColor || '#0052CC', coverImageUrl || null, visibility || 'private', createdBy]
  );
  return result.rows[0];
};

const findBoardById = async (id) => {
  const result = await query(`SELECT * FROM boards WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const findBoardsByOrgId = async (organizationId) => {
  const result = await query(
    `SELECT * FROM boards WHERE organization_id = $1 AND is_archived = false ORDER BY created_at DESC`,
    [organizationId]
  );
  return result.rows;
};

const updateBoard = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findBoardById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);

  const result = await query(
    `UPDATE boards SET ${setClauses}, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const deleteBoard = async (id) => {
  await query(`DELETE FROM boards WHERE id = $1`, [id]);
};

const addMember = async (boardId, userId, role, invitedBy) => {
  const result = await query(
    `INSERT INTO board_members (board_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [boardId, userId, role, invitedBy || null]
  );
  return result.rows[0];
};

const getMember = async (boardId, userId) => {
  const result = await query(
    `SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2`,
    [boardId, userId]
  );
  return result.rows[0] || null;
};

const getMembers = async (boardId) => {
  const result = await query(
    `SELECT bm.*, u.email, u.full_name, u.avatar_url
     FROM board_members bm
     JOIN users u ON u.id = bm.user_id
     WHERE bm.board_id = $1
     ORDER BY bm.joined_at ASC`,
    [boardId]
  );
  return result.rows;
};

const updateMemberRole = async (boardId, userId, role) => {
  const result = await query(
    `UPDATE board_members SET role = $3
     WHERE board_id = $1 AND user_id = $2
     RETURNING *`,
    [boardId, userId, role]
  );
  return result.rows[0] || null;
};

const removeMember = async (boardId, userId) => {
  await query(
    `DELETE FROM board_members WHERE board_id = $1 AND user_id = $2`,
    [boardId, userId]
  );
};

const findUserById = async (id) => {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

// ── Board Invitations ─────────────────────────────────────────────────────────

const createInvitation = async (boardId, email, role, token, invitedBy, expiresAt) => {
  const result = await query(
    `INSERT INTO board_invitations (board_id, email, role, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [boardId, email, role, token, invitedBy, expiresAt]
  );
  return result.rows[0];
};

const findInvitationByToken = async (token) => {
  const result = await query(
    `SELECT bi.*, b.name AS board_name, u.full_name AS inviter_name
     FROM board_invitations bi
     JOIN boards b ON b.id = bi.board_id
     LEFT JOIN users u ON u.id = bi.invited_by
     WHERE bi.token = $1`,
    [token]
  );
  return result.rows[0] || null;
};

const findPendingInvitation = async (boardId, email) => {
  const result = await query(
    `SELECT * FROM board_invitations
     WHERE board_id = $1 AND email = $2
       AND accepted_at IS NULL AND expires_at > NOW()`,
    [boardId, email]
  );
  return result.rows[0] || null;
};

const findPendingInvitationsByBoard = async (boardId) => {
  const result = await query(
    `SELECT bi.*, u.full_name AS inviter_name
     FROM board_invitations bi
     LEFT JOIN users u ON u.id = bi.invited_by
     WHERE bi.board_id = $1
       AND bi.accepted_at IS NULL AND bi.expires_at > NOW()
     ORDER BY bi.created_at DESC`,
    [boardId]
  );
  return result.rows;
};

const markInvitationAccepted = async (invitationId) => {
  await query(
    `UPDATE board_invitations SET accepted_at = NOW() WHERE id = $1`,
    [invitationId]
  );
};

const deleteInvitation = async (invitationId) => {
  await query(`DELETE FROM board_invitations WHERE id = $1`, [invitationId]);
};

module.exports = {
  createBoard,
  findBoardById,
  findBoardsByOrgId,
  updateBoard,
  deleteBoard,
  addMember,
  getMember,
  getMembers,
  updateMemberRole,
  removeMember,
  findUserById,
  createInvitation,
  findInvitationByToken,
  findPendingInvitation,
  findPendingInvitationsByBoard,
  markInvitationAccepted,
  deleteInvitation,
};
