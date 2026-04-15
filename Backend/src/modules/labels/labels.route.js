const Joi = require('joi');
const controller = require('./labels.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createLabelSchema = Joi.object({
  name: Joi.string().max(100).optional().allow('', null),
  color: Joi.string().max(20).required(),
});

const updateLabelSchema = Joi.object({
  name: Joi.string().max(100).optional().allow('', null),
  color: Joi.string().max(20).optional(),
});

// Mounted at /boards/:boardId/labels
const boardLabelsRouter = require('express').Router({ mergeParams: true });
boardLabelsRouter.use(authenticate);
boardLabelsRouter.get('/', controller.getBoardLabels);
boardLabelsRouter.post('/', validate(createLabelSchema), controller.createLabel);

// Mounted at /labels/:labelId
const labelRouter = require('express').Router({ mergeParams: true });
labelRouter.use(authenticate);
labelRouter.put('/', validate(updateLabelSchema), controller.updateLabel);
labelRouter.delete('/', controller.deleteLabel);

// Mounted at /cards/:cardId/labels
const cardLabelsRouter = require('express').Router({ mergeParams: true });
cardLabelsRouter.use(authenticate);
cardLabelsRouter.get('/', controller.getCardLabels);
cardLabelsRouter.post('/:labelId', controller.addCardLabel);
cardLabelsRouter.delete('/:labelId', controller.removeCardLabel);

module.exports = { boardLabelsRouter, labelRouter, cardLabelsRouter };
