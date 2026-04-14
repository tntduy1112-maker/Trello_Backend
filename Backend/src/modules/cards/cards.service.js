const model = require('./cards.model');
const listModel = require('../lists/lists.model');
const boardModel = require('../boards/boards.model');

const assertBoardAccess = async (userId, boardId) => {
  const board = await boardModel.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }
  const member = await boardModel.getMember(boardId, userId);
  if (!member) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return { board, member };
};

const getCards = async (userId, listId) => {
  const list = await listModel.findListById(listId);
  if (!list) { const e = new Error('List not found'); e.statusCode = 404; throw e; }
  await assertBoardAccess(userId, list.board_id);
  return model.findCardsByListId(listId);
};

const getCard = async (userId, cardId) => {
  const card = await model.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  return card;
};

const createCard = async (userId, listId, { title }) => {
  const list = await listModel.findListById(listId);
  if (!list) { const e = new Error('List not found'); e.statusCode = 404; throw e; }
  await assertBoardAccess(userId, list.board_id);
  const maxPos = await model.getMaxPosition(listId);
  const card = await model.createCard(listId, list.board_id, title, maxPos + 1, userId);
  // Return with empty assignees array
  return { ...card, assignees: [] };
};

const updateCard = async (userId, cardId, fields) => {
  const card = await model.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);

  const allowed = {};
  if (fields.title !== undefined) allowed.title = fields.title;
  if (fields.description !== undefined) allowed.description = fields.description;
  if (fields.priority !== undefined) allowed.priority = fields.priority;
  if ('dueDate' in fields) allowed.due_date = fields.dueDate || null;
  if (fields.isArchived !== undefined) allowed.is_archived = fields.isArchived;
  if (fields.isCompleted !== undefined) allowed.is_completed = fields.isCompleted;
  if (fields.coverColor !== undefined) allowed.cover_color = fields.coverColor;
  if (fields.position !== undefined) allowed.position = fields.position;
  if (fields.listId !== undefined) allowed.list_id = fields.listId;

  // Handle single assignee
  if ('assigneeId' in fields) {
    await model.removeCardMembers(cardId);
    if (fields.assigneeId) {
      await model.setCardMember(cardId, fields.assigneeId, userId);
    }
  }

  if (Object.keys(allowed).length > 0) {
    await model.updateCard(cardId, allowed);
  }

  return model.findCardById(cardId);
};

const deleteCard = async (userId, cardId) => {
  const card = await model.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  await model.deleteCard(cardId);
};

module.exports = { getCards, getCard, createCard, updateCard, deleteCard };
