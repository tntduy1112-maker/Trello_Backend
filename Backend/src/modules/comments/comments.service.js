const model = require('./comments.model');
const cardModel = require('../cards/cards.model');
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

const getCardBoardId = async (cardId) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  return { card, boardId: list.board_id };
};

const getAssigneeId = (card) =>
  Array.isArray(card.assignees) && card.assignees.length > 0
    ? card.assignees[0].user_id
    : null;

const getComments = async (userId, cardId) => {
  const { boardId } = await getCardBoardId(cardId);
  await assertBoardAccess(userId, boardId);
  return model.findByCardId(cardId);
};

const createComment = async (userId, cardId, { content, parentId = null }) => {
  const { card, boardId } = await getCardBoardId(cardId);
  await assertBoardAccess(userId, boardId);

  let parent = null;
  if (parentId) {
    parent = await model.findById(parentId);
    if (!parent) { const e = new Error('Parent comment not found'); e.statusCode = 404; throw e; }
    if (parent.card_id !== cardId) { const e = new Error('Parent comment does not belong to this card'); e.statusCode = 400; throw e; }
    // Only allow 1 level of nesting — reject reply-to-reply
    if (parent.parent_id) { const e = new Error('Cannot reply to a reply'); e.statusCode = 400; throw e; }
  }

  const comment = await model.createComment(cardId, userId, content, parentId);
  logActivity({ userId, entityType: 'card', entityId: cardId, boardId, action: 'comment.added', metadata: { parentId } });

  // Notify card assignee about new comment (skip if commenter IS the assignee)
  const assigneeId = getAssigneeId(card);
  if (assigneeId && assigneeId !== userId) {
    sendNotification({
      userId: assigneeId,
      type: 'comment_added',
      title: 'Bình luận mới trên card của bạn',
      message: `Có người đã bình luận trên card "${card.title}"`,
      entityType: 'card',
      entityId: cardId,
    });
  }

  // Notify parent comment author when someone replies (avoid duplicate if they are the assignee)
  if (parent && parent.user_id !== userId && parent.user_id !== assigneeId) {
    sendNotification({
      userId: parent.user_id,
      type: 'comment_added',
      title: 'Có người trả lời bình luận của bạn',
      message: `Có người đã reply bình luận của bạn trên card "${card.title}"`,
      entityType: 'card',
      entityId: cardId,
    });
  }

  return comment;
};

const updateComment = async (userId, commentId, { content }) => {
  const comment = await model.findById(commentId);
  if (!comment) { const e = new Error('Comment not found'); e.statusCode = 404; throw e; }
  if (comment.user_id !== userId) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return model.updateComment(commentId, content);
};

const deleteComment = async (userId, commentId) => {
  const comment = await model.findById(commentId);
  if (!comment) { const e = new Error('Comment not found'); e.statusCode = 404; throw e; }
  if (comment.user_id !== userId) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  await model.deleteComment(commentId);
};

module.exports = { getComments, createComment, updateComment, deleteComment };
