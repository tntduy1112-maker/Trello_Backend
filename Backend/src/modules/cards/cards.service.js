const model = require('./cards.model');
const listModel = require('../lists/lists.model');
const boardModel = require('../boards/boards.model');
const { logActivity } = require('../../utils/activityLogger');
const { sendNotification } = require('../../utils/notificationSender');

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
  logActivity({ userId, entityType: 'card', entityId: card.id, boardId: list.board_id, action: 'card.created', metadata: { title: card.title } });
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
      // Notify the new assignee (skip self-assign)
      if (fields.assigneeId !== userId) {
        sendNotification({
          userId: fields.assigneeId,
          type: 'card_assigned',
          title: 'Bạn được giao việc',
          message: `Bạn đã được assign vào card "${card.title}"`,
          entityType: 'card',
          entityId: cardId,
        });
      }
    }
  }

  // Build change log before writing
  const FIELD_LABEL = {
    title: 'title', description: 'description', priority: 'priority',
    due_date: 'dueDate', is_archived: 'archived', is_completed: 'completed',
    cover_color: 'coverColor',
    // list_id is handled separately below to store names instead of UUIDs
  };
  const changes = [];
  for (const [dbKey, label] of Object.entries(FIELD_LABEL)) {
    if (dbKey in allowed && String(allowed[dbKey]) !== String(card[dbKey])) {
      changes.push({ field: label, oldValue: card[dbKey], newValue: allowed[dbKey] });
    }
  }
  // Log list move with human-readable names
  if ('list_id' in allowed && String(allowed.list_id) !== String(card.list_id)) {
    const newList = await listModel.findListById(allowed.list_id);
    changes.push({ field: 'list', oldValue: list.name, newValue: newList?.name || allowed.list_id });
  }
  if ('assigneeId' in fields) {
    const oldAssignee = Array.isArray(card.assignees) ? (card.assignees[0]?.full_name || null) : null;
    changes.push({ field: 'assignee', oldValue: oldAssignee, newValue: fields.assigneeId || null });
  }

  if (Object.keys(allowed).length > 0) {
    await model.updateCard(cardId, allowed);
  }

  if (changes.length > 0) {
    logActivity({ userId, entityType: 'card', entityId: cardId, boardId: list.board_id, action: 'card.updated', metadata: { changes } });
  }

  return model.findCardById(cardId);
};

const deleteCard = async (userId, cardId) => {
  const card = await model.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  logActivity({ userId, entityType: 'card', entityId: cardId, boardId: list.board_id, action: 'card.deleted', metadata: { title: card.title } });
  await model.deleteCard(cardId);
};

module.exports = { getCards, getCard, createCard, updateCard, deleteCard };
