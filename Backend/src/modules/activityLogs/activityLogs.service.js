const model = require('./activityLogs.model');
const boardModel = require('../boards/boards.model');
const cardModel = require('../cards/cards.model');
const listModel = require('../lists/lists.model');

const assertBoardAccess = async (userId, boardId) => {
  const board = await boardModel.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }
  const member = await boardModel.getMember(boardId, userId);
  if (!member) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return { board, member };
};

const getBoardActivity = async (userId, boardId, limit, offset) => {
  await assertBoardAccess(userId, boardId);
  return model.getByBoard(boardId, limit, offset);
};

const getCardActivity = async (userId, cardId, limit, offset) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  return model.getByCard(cardId, limit, offset);
};

module.exports = { getBoardActivity, getCardActivity };
