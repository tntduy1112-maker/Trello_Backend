const multer = require('multer');
const controller = require('./attachments.controller');
const authenticate = require('../../middlewares/authenticate');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit at transport layer
});

// Mounted at /cards/:cardId/attachments
const cardAttachmentsRouter = require('express').Router({ mergeParams: true });
cardAttachmentsRouter.use(authenticate);
cardAttachmentsRouter.get('/', controller.getAttachments);
cardAttachmentsRouter.post('/', upload.single('file'), controller.addAttachment);
cardAttachmentsRouter.delete('/:attachmentId', controller.deleteAttachment);
cardAttachmentsRouter.patch('/:attachmentId/cover', controller.toggleCover);

module.exports = { cardAttachmentsRouter };
