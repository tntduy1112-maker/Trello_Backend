const router = require('express').Router();
const Joi = require('joi');
const controller = require('./organizations.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');

const createOrgSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  logoUrl: Joi.string().uri().optional().allow(''),
});

const updateOrgSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  logoUrl: Joi.string().uri().optional().allow(''),
});

const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'member').default('member'),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member').required(),
});

router.use(authenticate);

router.post('/', validate(createOrgSchema), controller.createOrg);
router.get('/', controller.getUserOrgs);
router.get('/:orgId', controller.getOrg);
router.put('/:orgId', validate(updateOrgSchema), controller.updateOrg);
router.delete('/:orgId', controller.deleteOrg);

router.get('/:orgId/members', controller.getMembers);
router.post('/:orgId/members', validate(inviteMemberSchema), controller.inviteMember);
router.put('/:orgId/members/:userId', validate(updateRoleSchema), controller.updateMemberRole);
router.delete('/:orgId/members/:userId', controller.removeMember);

module.exports = router;
