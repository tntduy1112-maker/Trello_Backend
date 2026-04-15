const Joi = require('joi');
const controller = require('./comments.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  parentId: Joi.string().uuid().optional().allow(null),
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

// Mounted at /cards/:cardId/comments
const cardCommentsRouter = require('express').Router({ mergeParams: true });
cardCommentsRouter.use(authenticate);
cardCommentsRouter.get('/', controller.getComments);
cardCommentsRouter.post('/', validate(createCommentSchema), controller.createComment);

// Mounted at /comments/:commentId
const commentRouter = require('express').Router({ mergeParams: true });
commentRouter.use(authenticate);
commentRouter.put('/', validate(updateCommentSchema), controller.updateComment);
commentRouter.delete('/', controller.deleteComment);

module.exports = { cardCommentsRouter, commentRouter };
