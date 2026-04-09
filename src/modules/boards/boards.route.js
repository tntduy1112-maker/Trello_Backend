const router = require('express').Router({ mergeParams: true });
const Joi = require('joi');
const controller = require('./boards.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createBoardSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  coverColor: Joi.string().max(20).optional(),
  coverImageUrl: Joi.string().uri().optional().allow(''),
  visibility: Joi.string().valid('private', 'workspace', 'public').default('private'),
});

const updateBoardSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  coverColor: Joi.string().max(20).optional(),
  coverImageUrl: Joi.string().uri().optional().allow(''),
  visibility: Joi.string().valid('private', 'workspace', 'public').optional(),
  isArchived: Joi.boolean().optional(),
});

const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'member', 'viewer').default('member'),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member', 'viewer').required(),
});

router.use(authenticate);

// Board CRUD — scoped under /organizations/:orgId/boards
router.post('/', validate(createBoardSchema), controller.createBoard);
router.get('/', controller.getBoardsByOrg);

// Board detail routes — mounted at /boards/:boardId
const boardRouter = require('express').Router({ mergeParams: true });
boardRouter.use(authenticate);
boardRouter.get('/', controller.getBoard);
boardRouter.put('/', validate(updateBoardSchema), controller.updateBoard);
boardRouter.delete('/', controller.deleteBoard);
boardRouter.get('/members', controller.getMembers);
boardRouter.post('/members', validate(inviteMemberSchema), controller.inviteMember);
boardRouter.put('/members/:userId', validate(updateRoleSchema), controller.updateMemberRole);
boardRouter.delete('/members/:userId', controller.removeMember);

module.exports = { orgBoardsRouter: router, boardRouter };
