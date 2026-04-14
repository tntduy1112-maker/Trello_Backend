const model = require('./boards.model');
const orgModel = require('../organizations/organizations.model');
const { findUserByEmail } = require('../auth/auth.model');

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
  if (!board) {
    const err = new Error('Board not found');
    err.statusCode = 404;
    throw err;
  }

  const requester = await model.getMember(boardId, userId);
  assertBoardRole(requester, ['owner', 'admin']);

  const targetUser = await findUserByEmail(email);
  if (!targetUser) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = await model.getMember(boardId, targetUser.id);
  if (existing) {
    const err = new Error('User is already a board member');
    err.statusCode = 409;
    throw err;
  }

  return model.addMember(boardId, targetUser.id, role || 'member', userId);
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
};
