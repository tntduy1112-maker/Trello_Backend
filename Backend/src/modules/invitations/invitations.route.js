const router = require('express').Router();
const controller = require('./invitations.controller');
const authenticate = require('../../middlewares/authenticate');

// Public: anyone can preview an invitation (no auth required)
router.get('/:token', controller.previewInvitation);

// Protected: must be logged in to accept
router.post('/:token/accept', authenticate, controller.acceptInvitation);

module.exports = router;
