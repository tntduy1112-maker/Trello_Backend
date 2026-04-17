const model = require('./checklists.model');
const cardModel = require('../cards/cards.model');
const listModel = require('../lists/lists.model');
const boardModel = require('../boards/boards.model');
const { logActivity } = require('../../utils/activityLogger');

const assertBoardAccess = async (userId, boardId) => {
  const board = await boardModel.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }
  const member = await boardModel.getMember(boardId, userId);
  if (!member) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return { board, member };
};

const getCardBoardId = async (cardId) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  return { card, boardId: list.board_id };
};

const getChecklistBoardId = async (checklistId) => {
  const checklist = await model.findChecklistById(checklistId);
  if (!checklist) { const e = new Error('Checklist not found'); e.statusCode = 404; throw e; }
  const { card, boardId } = await getCardBoardId(checklist.card_id);
  return { checklist, card, boardId };
};

const getItemBoardId = async (itemId) => {
  const item = await model.findItemById(itemId);
  if (!item) { const e = new Error('Checklist item not found'); e.statusCode = 404; throw e; }
  const { checklist, card, boardId } = await getChecklistBoardId(item.checklist_id);
  return { item, checklist, card, boardId };
};

// ── Checklists ────────────────────────────────────────────────────────────────

const getChecklists = async (userId, cardId) => {
  const { boardId } = await getCardBoardId(cardId);
  await assertBoardAccess(userId, boardId);
  return model.findByCardId(cardId);
};

const createChecklist = async (userId, cardId, { title }) => {
  const { card, boardId } = await getCardBoardId(cardId);
  await assertBoardAccess(userId, boardId);

  const maxPos = await model.getMaxChecklistPosition(cardId);
  const checklist = await model.createChecklist(cardId, title, maxPos + 1000);

  logActivity({ userId, entityType: 'card', entityId: cardId, boardId, action: 'checklist.created', metadata: { title } });
  return checklist;
};

const updateChecklist = async (userId, checklistId, { title }) => {
  const { checklist, boardId } = await getChecklistBoardId(checklistId);
  await assertBoardAccess(userId, boardId);

  const updated = await model.updateChecklist(checklistId, title);
  return updated;
};

const deleteChecklist = async (userId, checklistId) => {
  const { checklist, card, boardId } = await getChecklistBoardId(checklistId);
  await assertBoardAccess(userId, boardId);

  await model.deleteChecklist(checklistId);
  logActivity({ userId, entityType: 'card', entityId: card.id, boardId, action: 'checklist.deleted', metadata: { title: checklist.title } });
};

// ── Checklist Items ───────────────────────────────────────────────────────────

const addItem = async (userId, checklistId, { content }) => {
  const { checklist, boardId } = await getChecklistBoardId(checklistId);
  await assertBoardAccess(userId, boardId);

  const maxPos = await model.getMaxItemPosition(checklistId);
  const item = await model.createItem(checklistId, content, maxPos + 1000);
  return item;
};

const updateItem = async (userId, itemId, fields) => {
  const { item, card, boardId } = await getItemBoardId(itemId);
  await assertBoardAccess(userId, boardId);

  const dbFields = {};
  if (fields.content !== undefined)      dbFields.content = fields.content;
  if (fields.is_completed !== undefined) {
    dbFields.is_completed = fields.is_completed;
    dbFields.completed_at = fields.is_completed ? new Date() : null;

    const action = fields.is_completed ? 'checklist_item.completed' : 'checklist_item.uncompleted';
    logActivity({ userId, entityType: 'card', entityId: card.id, boardId, action, metadata: { content: item.content } });
  }

  const updated = await model.updateItem(itemId, dbFields);
  return updated;
};

const deleteItem = async (userId, itemId) => {
  const { boardId } = await getItemBoardId(itemId);
  await assertBoardAccess(userId, boardId);
  await model.deleteItem(itemId);
};

module.exports = {
  getChecklists,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  addItem,
  updateItem,
  deleteItem,
};
