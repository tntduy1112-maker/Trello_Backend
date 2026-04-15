const controller = require('./activityLogs.controller');
const authenticate = require('../../middlewares/authenticate');

// Mounted at /boards/:boardId/activity
const boardActivityRouter = require('express').Router({ mergeParams: true });
boardActivityRouter.use(authenticate);
boardActivityRouter.get('/', controller.getBoardActivity);

// Mounted at /cards/:cardId/activity
const cardActivityRouter = require('express').Router({ mergeParams: true });
cardActivityRouter.use(authenticate);
cardActivityRouter.get('/', controller.getCardActivity);

module.exports = { boardActivityRouter, cardActivityRouter };
