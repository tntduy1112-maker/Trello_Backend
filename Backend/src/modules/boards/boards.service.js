const crypto = require('crypto');
const model = require('./boards.model');
const orgModel = require('../organizations/organizations.model');
const { findUserByEmail } = require('../auth/auth.model');
const { sendBoardAddedEmail, sendBoardInvitationEmail } = require('../../utils/email');

const assertBoardRole = (member, allowedRoles) => {
  if (!member || !allowedRoles.includes(member.role)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
};

const createBoard = async (userId, orgId, fields) => {
  const org = await orgModel.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const orgMember = await orgModel.getMember(orgId, userId);
  if (!orgMember) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const { name, description, coverColor, coverImageUrl, visibility } = fields;
  const board = await model.createBoard(orgId, name, description, coverColor, coverImageUrl, visibility, userId);
  await model.addMember(board.id, userId, 'owner', null);
  return board;
};

const getBoard = async (userId, boardId) => {
  const board = await model.findBoardById(boardId);
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  if (board.visibility === 'public') return board;

  const member = await model.getMember(boardId, userId);
  if (board.visibility === 'workspace') {
    const orgMember = await orgModel.getMember(board.organization_id, userId);
    if (!orgMember && !member) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
  } else {
    if (!member) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
  }

  return board;
};

const getBoardsByOrg = async (userId, orgId) => {
  const org = await orgModel.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const orgMember = await orgModel.getMember(orgId, userId);
  if (!orgMember) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const boards = await model.findBoardsByOrgId(orgId);

  return boards.filter(async (board) => {
    if (board.visibility === 'public' || board.visibility === 'workspace') return true;
    const bm = await model.getMember(board.id, userId);
    return !!bm;
  });
};

const getBoardsByOrgFiltered = async (userId, orgId) => {
  const org = await orgModel.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const orgMember = await orgModel.getMember(orgId, userId);
  if (!orgMember) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const boards = await model.findBoardsByOrgId(orgId);
  const visible = [];

  for (const board of boards) {
    if (board.visibility === 'public' || board.visibility === 'workspace') {
      visible.push(board);
    } else {
      const bm = await model.getMember(board.id, userId);
      if (bm) visible.push(board);
    }
  }

  return visible;
};

const updateBoard = async (userId, boardId, fields) => {
  const board = await model.findBoardById(boardId);
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  const member = await model.getMember(boardId, userId);
  assertBoardRole(member, ['owner', 'admin']);

  const allowed = {};
  if (fields.name !== undefined) allowed.name = fields.name;
  if (fields.description !== undefined) allowed.description = fields.description;
  if (fields.coverColor !== undefined) allowed.cover_color = fields.coverColor;
  if (fields.coverImageUrl !== undefined) allowed.cover_image_url = fields.coverImageUrl;
  if (fields.visibility !== undefined) allowed.visibility = fields.visibility;
  if (fields.isArchived !== undefined) allowed.is_archived = fields.isArchived;

  return model.updateBoard(boardId, allowed);
};

const deleteBoard = async (userId, boardId) => {
  const board = await model.findBoardById(boardId);
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  const member = await model.getMember(boardId, userId);
  assertBoardRole(member, ['owner']);

  await model.deleteBoard(boardId);
};

const inviteMember = async (userId, boardId, { email, role }) => {
  const board = await model.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }

  const requester = await model.getMember(boardId, userId);
  assertBoardRole(requester, ['owner', 'admin']);

  const inviter = await model.findUserById(userId);
  const targetUser = await findUserByEmail(email);

  if (targetUser) {
    // ── Flow A: user already has an account ──────────────────────────────────
    const existing = await model.getMember(boardId, targetUser.id);
    if (existing) { const e = new Error('User is already a board member'); e.statusCode = 409; throw e; }

    const member = await model.addMember(boardId, targetUser.id, role || 'member', userId);
    sendBoardAddedEmail(
      targetUser.email, targetUser.full_name, board.name, inviter?.full_name || 'Someone'
    ).catch(() => {});

    return { status: 'added', member };
  }

  // ── Flow B: email has no account yet ─────────────────────────────────────
  const pending = await model.findPendingInvitation(boardId, email);
  if (pending) {
    const e = new Error('Lời mời đang chờ đã được gửi tới email này');
    e.statusCode = 409;
    throw e;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await model.createInvitation(boardId, email, role || 'member', token, userId, expiresAt);
  sendBoardInvitationEmail(
    email, board.name, inviter?.full_name || 'Someone', token
  ).catch(() => {});

  return { status: 'invited', email };
};

const getPendingInvitations = async (userId, boardId) => {
  const board = await model.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }

  const requester = await model.getMember(boardId, userId);
  assertBoardRole(requester, ['owner', 'admin']);

  return model.findPendingInvitationsByBoard(boardId);
};

const revokeInvitation = async (userId, boardId, invitationId) => {
  const board = await model.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }

  const requester = await model.getMember(boardId, userId);
  assertBoardRole(requester, ['owner', 'admin']);

  await model.deleteInvitation(invitationId);
};

const updateMemberRole = async (userId, boardId, targetUserId, role) => {
  const board = await model.findBoardById(boardId);
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  const requester = await model.getMember(boardId, userId);
  assertBoardRole(requester, ['owner', 'admin']);

  const target = await model.getMember(boardId, targetUserId);
  if (!target) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  if (target.role === 'owner') {
    const err = new Error('Cannot change owner role');
    err.statusCode = 403;
    throw err;
  }

  return model.updateMemberRole(boardId, targetUserId, role);
};

const removeMember = async (userId, boardId, targetUserId) => {
  const board = await model.findBoardById(boardId);
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  const requester = await model.getMember(boardId, userId);
  assertBoardRole(requester, ['owner', 'admin']);

  const target = await model.getMember(boardId, targetUserId);
  if (!target) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  if (target.role === 'owner') {
    const err = new Error('Cannot remove owner');
    err.statusCode = 403;
    throw err;
  }

  await model.removeMember(boardId, targetUserId);
};

const getMembers = async (userId, boardId) => {
  const board = await model.findBoardById(boardId);
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  const member = await model.getMember(boardId, userId);
  if (!member) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return model.getMembers(boardId);
};

module.exports = {
  createBoard,
  getBoard,
  getBoardsByOrg: getBoardsByOrgFiltered,
  updateBoard,
  deleteBoard,
  inviteMember,
  updateMemberRole,
  removeMember,
  getMembers,
  getPendingInvitations,
  revokeInvitation,
};
