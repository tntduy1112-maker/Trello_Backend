const service = require('./comments.service');
const { success } = require('../../utils/response');

const getComments = async (req, res, next) => {
  try {
    const comments = await service.getComments(req.user.userId, req.params.cardId);
    return success(res, { comments });
  } catch (err) { next(err); }
};

const createComment = async (req, res, next) => {
  try {
    const comment = await service.createComment(req.user.userId, req.params.cardId, req.body);
    return success(res, { comment }, 'Comment created', 201);
  } catch (err) { next(err); }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await service.updateComment(req.user.userId, req.params.commentId, req.body);
    return success(res, { comment }, 'Comment updated');
  } catch (err) { next(err); }
};

const deleteComment = async (req, res, next) => {
  try {
    await service.deleteComment(req.user.userId, req.params.commentId);
    return success(res, null, 'Comment deleted');
  } catch (err) { next(err); }
};

module.exports = { getComments, createComment, updateComment, deleteComment };
