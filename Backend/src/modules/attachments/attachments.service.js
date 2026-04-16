const model = require('./attachments.model');
const cardModel = require('../cards/cards.model');
const listModel = require('../lists/lists.model');
const boardModel = require('../boards/boards.model');
const { uploadFile, deleteFile, getPublicUrl } = require('../../utils/storage');
const { logActivity } = require('../../utils/activityLogger');

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
]);

const assertBoardAccess = async (userId, boardId) => {
  const board = await boardModel.findBoardById(boardId);
  if (!board) { const e = new Error('Board not found'); e.statusCode = 404; throw e; }
  const member = await boardModel.getMember(boardId, userId);
  if (!member) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return { board, member };
};

const getCardAttachments = async (userId, cardId) => {
  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);
  return model.findByCardId(cardId);
};

const addAttachment = async (userId, cardId, file) => {
  if (!file) { const e = new Error('No file provided'); e.statusCode = 400; throw e; }
  if (file.size > MAX_SIZE) { const e = new Error('File quá lớn (tối đa 10 MB)'); e.statusCode = 400; throw e; }
  if (!ALLOWED_MIME.has(file.mimetype)) { const e = new Error('Loại file không được hỗ trợ'); e.statusCode = 400; throw e; }

  const card = await cardModel.findCardById(cardId);
  if (!card) { const e = new Error('Card not found'); e.statusCode = 404; throw e; }
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);

  const objectName = await uploadFile({
    buffer: file.buffer,
    mimetype: file.mimetype,
    folder: 'attachments',
    filename: file.originalname,
  });
  const fileUrl = getPublicUrl(objectName);

  const attachment = await model.createAttachment({
    cardId,
    uploadedBy: userId,
    fileName: file.originalname,
    fileUrl,
    objectName,
    fileType: file.mimetype,
    fileSize: file.size,
  });

  logActivity({
    userId,
    entityType: 'card',
    entityId: cardId,
    boardId: list.board_id,
    action: 'attachment.added',
    metadata: { fileName: file.originalname },
  });

  return attachment;
};

const deleteAttachment = async (userId, cardId, attachmentId) => {
  const attachment = await model.findById(attachmentId);
  if (!attachment || attachment.card_id !== cardId) {
    const e = new Error('Attachment not found'); e.statusCode = 404; throw e;
  }

  const card = await cardModel.findCardById(cardId);
  const list = await listModel.findListById(card.list_id);
  const { member } = await assertBoardAccess(userId, list.board_id);

  const canDelete = attachment.uploaded_by === userId || ['owner', 'admin'].includes(member.role);
  if (!canDelete) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }

  // Delete from MinIO
  if (attachment.object_name) {
    await deleteFile(attachment.object_name).catch(() => {}); // ignore storage errors
  }

  // If this was the cover, clear card.cover_image_url
  if (attachment.is_cover) {
    await cardModel.updateCard(cardId, { cover_image_url: null });
  }

  await model.deleteAttachment(attachmentId);

  logActivity({
    userId,
    entityType: 'card',
    entityId: cardId,
    boardId: list.board_id,
    action: 'attachment.deleted',
    metadata: { fileName: attachment.file_name },
  });
};

/**
 * Toggle an attachment as the card cover.
 * If already cover → unset. Otherwise → set as cover.
 * Only image files can be set as cover.
 */
const toggleCover = async (userId, cardId, attachmentId) => {
  const attachment = await model.findById(attachmentId);
  if (!attachment || attachment.card_id !== cardId) {
    const e = new Error('Attachment not found'); e.statusCode = 404; throw e;
  }
  if (!attachment.file_type.startsWith('image/')) {
    const e = new Error('Chỉ ảnh mới có thể đặt làm bìa'); e.statusCode = 400; throw e;
  }

  const card = await cardModel.findCardById(cardId);
  const list = await listModel.findListById(card.list_id);
  await assertBoardAccess(userId, list.board_id);

  if (attachment.is_cover) {
    // Unset cover
    await model.unsetCover(cardId);
    await cardModel.updateCard(cardId, { cover_image_url: null });
    logActivity({ userId, entityType: 'card', entityId: cardId, boardId: list.board_id, action: 'attachment.cover_removed', metadata: {} });
    return { isCover: false, coverImageUrl: null };
  } else {
    // Set as cover
    await model.setCover(cardId, attachmentId);
    await cardModel.updateCard(cardId, { cover_image_url: attachment.file_url });
    logActivity({ userId, entityType: 'card', entityId: cardId, boardId: list.board_id, action: 'attachment.cover_set', metadata: { fileName: attachment.file_name } });
    return { isCover: true, coverImageUrl: attachment.file_url };
  }
};

module.exports = { getCardAttachments, addAttachment, deleteAttachment, toggleCover };
