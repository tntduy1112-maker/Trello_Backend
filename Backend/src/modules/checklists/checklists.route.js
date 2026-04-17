const Joi = require('joi');
const controller = require('./checklists.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createChecklistSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
});

const updateChecklistSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
});

const addItemSchema = Joi.object({
  content: Joi.string().min(1).max(500).required(),
});

const updateItemSchema = Joi.object({
  content:      Joi.string().min(1).max(500).optional(),
  is_completed: Joi.boolean().optional(),
}).min(1);

// Mounted at /cards/:cardId/checklists
const cardChecklistsRouter = require('express').Router({ mergeParams: true });
cardChecklistsRouter.use(authenticate);
cardChecklistsRouter.get('/',  controller.getChecklists);
cardChecklistsRouter.post('/', validate(createChecklistSchema), controller.createChecklist);

// Mounted at /checklists/:checklistId
const checklistRouter = require('express').Router({ mergeParams: true });
checklistRouter.use(authenticate);
checklistRouter.put('/',    validate(updateChecklistSchema), controller.updateChecklist);
checklistRouter.delete('/', controller.deleteChecklist);

// Mounted at /checklists/:checklistId/items
const checklistItemsRouter = require('express').Router({ mergeParams: true });
checklistItemsRouter.use(authenticate);
checklistItemsRouter.post('/', validate(addItemSchema), controller.addItem);

// Mounted at /checklist-items/:itemId
const checklistItemRouter = require('express').Router({ mergeParams: true });
checklistItemRouter.use(authenticate);
checklistItemRouter.put('/',    validate(updateItemSchema), controller.updateItem);
checklistItemRouter.delete('/', controller.deleteItem);

module.exports = { cardChecklistsRouter, checklistRouter, checklistItemsRouter, checklistItemRouter };
