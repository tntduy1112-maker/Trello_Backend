const service = require('./organizations.service');
const { success, error } = require('../../utils/response');

const createOrg = async (req, res, next) => {
  try {
    const org = await service.createOrg(req.user.userId, req.body);
    return success(res, { organization: org }, 'Organization created', 201);
  } catch (err) {
    next(err);
  }
};

const getOrg = async (req, res, next) => {
  try {
    const org = await service.getOrg(req.user.userId, req.params.orgId);
    return success(res, { organization: org });
  } catch (err) {
    next(err);
  }
};

const getUserOrgs = async (req, res, next) => {
  try {
    const orgs = await service.getUserOrgs(req.user.userId);
    return success(res, { organizations: orgs });
  } catch (err) {
    next(err);
  }
};

const updateOrg = async (req, res, next) => {
  try {
    const org = await service.updateOrg(req.user.userId, req.params.orgId, req.body);
    return success(res, { organization: org }, 'Organization updated');
  } catch (err) {
    next(err);
  }
};

const deleteOrg = async (req, res, next) => {
  try {
    await service.deleteOrg(req.user.userId, req.params.orgId);
    return success(res, null, 'Organization deleted');
  } catch (err) {
    next(err);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const member = await service.inviteMember(req.user.userId, req.params.orgId, req.body);
    return success(res, { member }, 'Member invited', 201);
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await service.getMembers(req.user.userId, req.params.orgId);
    return success(res, { members });
  } catch (err) {
    next(err);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const member = await service.updateMemberRole(
      req.user.userId,
      req.params.orgId,
      req.params.userId,
      req.body.role
    );
    return success(res, { member }, 'Member role updated');
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await service.removeMember(req.user.userId, req.params.orgId, req.params.userId);
    return success(res, null, 'Member removed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrg,
  getOrg,
  getUserOrgs,
  updateOrg,
  deleteOrg,
  inviteMember,
  getMembers,
  updateMemberRole,
  removeMember,
};
