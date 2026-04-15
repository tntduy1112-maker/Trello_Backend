const model = require('./lists.model');
const boardModel = require('../boards/boards.model');
const { logActivity } = require('../../utils/activityLogger');

const assertBoardAccess = async (userId, boardId) => {
  const board = await boardModel.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }
  const member = await boardModel.getMember(boardId, userId);
  if (!member) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return { board, member };
};

const getLists = async (userId, boardId) => {
  await assertBoardAccess(userId, boardId);
  return model.findListsByBoardId(boardId);
};

const createList = async (userId, boardId, { name }) => {
  await assertBoardAccess(userId, boardId);
  const maxPos = await model.getMaxPosition(boardId);
  const list = await model.createList(boardId, name, maxPos + 1);
  logActivity({ userId, entityType: 'list', entityId: list.id, boardId, action: 'list.created', metadata: { name: list.name } });
  return list;
};

const updateList = async (userId, listId, fields) => {
  const list = await model.findListById(listId);
  if (!list) { const e = new Error('List not found'); e.statusCode = 404; throw e; }
  await assertBoardAccess(userId, list.board_id);

  const allowed = {};
  if (fields.name !== undefined) allowed.name = fields.name;
  if (fields.position !== undefined) allowed.position = fields.position;
  if (fields.isArchived !== undefined) allowed.is_archived = fields.isArchived;

  return model.updateList(listId, allowed);
};

const deleteList = async (userId, listId) => {
  const list = await model.findListById(listId);
  if (!list) { const e = new Error('List not found'); e.statusCode = 404; throw e; }
  await assertBoardAccess(userId, list.board_id);
  logActivity({ userId, entityType: 'list', entityId: listId, boardId: list.board_id, action: 'list.deleted', metadata: { name: list.name } });
  await model.deleteList(listId);
};

module.exports = { getLists, createList, updateList, deleteList };
