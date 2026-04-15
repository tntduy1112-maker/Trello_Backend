const model = require('./labels.model');
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

const getBoardLabels = async (userId, boardId) => {
  await assertBoardAccess(userId, boardId);
  return model.findLabelsByBoardId(boardId);
};

const createLabel = async (userId, boardId, { name, color }) => {
  await assertBoardAccess(userId, boardId);
  if (!color) { const e = new Error('Color is required'); e.statusCode = 400; throw e; }
  return model.createLabel(boardId, name, color);
};

const updateLabel = async (userId, labelId, fields) => {
  const label = await model.findLabelById(labelId);
  if (!label) { const e = new Error('Label not found'); e.statusCode = 404; throw e; }
  await assertBoardAccess(userId, label.board_id);

  const allowed = {};
  if (fields.name !== undefined) allowed.name = fields.name || null;
  if (fields.color !== undefined) allowed.color = fields.color;

  return model.updateLabel(labelId, allowed);
};

const deleteLabel = async (userId, labelId) => {
  const label = await model.findLabelById(labelId);
  if (!label) { const e = new Error('Label not found'); e.statusCode = 404; throw e; }
  await assertBoardAccess(userId, label.board_id);
  await model.deleteLabel(labelId);
};

const getCardLabels = async (userId, cardId) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  return model.getCardLabels(cardId);
};

const addCardLabel = async (userId, cardId, labelId) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const label = await model.findLabelById(labelId);
  if (!label) { const e = new Error('Label not found'); e.statusCode = 404; throw e; }

  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);

  // Ensure label belongs to same board as card
  if (label.board_id !== list.board_id) {
    const e = new Error('Label does not belong to this board'); e.statusCode = 400; throw e;
  }

  await model.addCardLabel(cardId, labelId);
  return model.getCardLabels(cardId);
};

const removeCardLabel = async (userId, cardId, labelId) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  await model.removeCardLabel(cardId, labelId);
  return model.getCardLabels(cardId);
};

module.exports = {
  getBoardLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  getCardLabels,
  addCardLabel,
  removeCardLabel,
};
