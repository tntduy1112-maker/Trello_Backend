const Joi = require('joi');
const controller = require('./lists.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createListSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
});

const updateListSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  position: Joi.number().optional(),
  isArchived: Joi.boolean().optional(),
});

// Mounted at /boards/:boardId/lists
const boardListsRouter = require('express').Router({ mergeParams: true });
boardListsRouter.use(authenticate);
boardListsRouter.get('/', controller.getLists);
boardListsRouter.post('/', validate(createListSchema), controller.createList);

// Mounted at /lists/:listId
const listRouter = require('express').Router({ mergeParams: true });
listRouter.use(authenticate);
listRouter.put('/', validate(updateListSchema), controller.updateList);
listRouter.delete('/', controller.deleteList);

module.exports = { boardListsRouter, listRouter };
