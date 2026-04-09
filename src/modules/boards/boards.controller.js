const service = require('./boards.service');
const { success, error } = require('../../utils/response');

const createBoard = async (req, res, next) => {
  try {
    const board = await service.createBoard(req.user.userId, req.params.orgId, req.body);
    return success(res, { board }, 'Board created', 201);
  } catch (err) {
    next(err);
  }
};

const getBoard = async (req, res, next) => {
  try {
    const board = await service.getBoard(req.user.userId, req.params.boardId);
    return success(res, { board });
  } catch (err) {
    next(err);
  }
};

const getBoardsByOrg = async (req, res, next) => {
  try {
    const boards = await service.getBoardsByOrg(req.user.userId, req.params.orgId);
    return success(res, { boards });
  } catch (err) {
    next(err);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    const board = await service.updateBoard(req.user.userId, req.params.boardId, req.body);
    return success(res, { board }, 'Board updated');
  } catch (err) {
    next(err);
  }
};

const deleteBoard = async (req, res, next) => {
  try {
    await service.deleteBoard(req.user.userId, req.params.boardId);
    return success(res, null, 'Board deleted');
  } catch (err) {
    next(err);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const member = await service.inviteMember(req.user.userId, req.params.boardId, req.body);
    return success(res, { member }, 'Member invited', 201);
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await service.getMembers(req.user.userId, req.params.boardId);
    return success(res, { members });
  } catch (err) {
    next(err);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const member = await service.updateMemberRole(
      req.user.userId,
      req.params.boardId,
      req.params.userId,
      req.body.role
    );
    return success(res, { member }, 'Member role updated');
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await service.removeMember(req.user.userId, req.params.boardId, req.params.userId);
    return success(res, null, 'Member removed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBoard,
  getBoard,
  getBoardsByOrg,
  updateBoard,
  deleteBoard,
  inviteMember,
  getMembers,
  updateMemberRole,
  removeMember,
};
