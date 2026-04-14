const Joi = require('joi');
const controller = require('./cards.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createCardSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
});

const updateCardSchema = Joi.object({
  title: Joi.string().min(1).max(500).optional(),
  description: Joi.string().max(10000).optional().allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  dueDate: Joi.string().isoDate().optional().allow('', null),
  isArchived: Joi.boolean().optional(),
  isCompleted: Joi.boolean().optional(),
  coverColor: Joi.string().max(20).optional().allow('', null),
  position: Joi.number().optional(),
  listId: Joi.string().uuid().optional(),
  assigneeId: Joi.string().uuid().optional().allow(null),
});

// Mounted at /lists/:listId/cards
const listCardsRouter = require('express').Router({ mergeParams: true });
listCardsRouter.use(authenticate);
listCardsRouter.get('/', controller.getCards);
listCardsRouter.post('/', validate(createCardSchema), controller.createCard);

// Mounted at /cards/:cardId
const cardRouter = require('express').Router({ mergeParams: true });
cardRouter.use(authenticate);
cardRouter.get('/', controller.getCard);
cardRouter.put('/', validate(updateCardSchema), controller.updateCard);
cardRouter.delete('/', controller.deleteCard);

module.exports = { listCardsRouter, cardRouter };
