const service = require('./attachments.service');
const { success } = require('../../utils/response');

const getAttachments = async (req, res, next) => {
  try {
    const attachments = await service.getCardAttachments(req.user.userId, req.params.cardId);
    return success(res, { attachments });
  } catch (err) { next(err); }
};

const addAttachment = async (req, res, next) => {
  try {
    const attachment = await service.addAttachment(req.user.userId, req.params.cardId, req.file);
    return success(res, { attachment }, 'Attachment uploaded', 201);
  } catch (err) { next(err); }
};

const deleteAttachment = async (req, res, next) => {
  try {
    await service.deleteAttachment(req.user.userId, req.params.cardId, req.params.attachmentId);
    return success(res, null, 'Attachment deleted');
  } catch (err) { next(err); }
};

const toggleCover = async (req, res, next) => {
  try {
    const result = await service.toggleCover(req.user.userId, req.params.cardId, req.params.attachmentId);
    return success(res, result, result.isCover ? 'Cover set' : 'Cover removed');
  } catch (err) { next(err); }
};

module.exports = { getAttachments, addAttachment, deleteAttachment, toggleCover };
