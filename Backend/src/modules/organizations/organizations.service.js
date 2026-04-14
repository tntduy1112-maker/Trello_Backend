const model = require('./organizations.model');
const { findUserByEmail } = require('../auth/auth.model');

const slugify = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
};

const ensureUniqueSlug = async (base) => {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { query } = require('../../configs/postgres');
    const result = await query(`SELECT id FROM organizations WHERE slug = $1`, [candidate]);
    if (result.rows.length === 0) return candidate;
    suffix++;
  }
};

const assertRole = (member, allowedRoles) => {
  if (!member || !allowedRoles.includes(member.role)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
};

const createOrg = async (userId, { name, description, logoUrl }) => {
  const slug = await ensureUniqueSlug(name);
  const org = await model.createOrganization(name, slug, description, logoUrl, userId);
  await model.addMember(org.id, userId, 'owner', null);
  return org;
};

const getOrg = async (userId, orgId) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const member = await model.getMember(orgId, userId);
  if (!member) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  return org;
};

const getUserOrgs = async (userId) => {
  return model.findOrgsByUserId(userId);
};

const updateOrg = async (userId, orgId, fields) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const member = await model.getMember(orgId, userId);
  assertRole(member, ['owner', 'admin']);

  const allowed = {};
  if (fields.name !== undefined) allowed.name = fields.name;
  if (fields.description !== undefined) allowed.description = fields.description;
  if (fields.logoUrl !== undefined) allowed.logo_url = fields.logoUrl;

  return model.updateOrganization(orgId, allowed);
};

const deleteOrg = async (userId, orgId) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const member = await model.getMember(orgId, userId);
  assertRole(member, ['owner']);
  await model.deleteOrganization(orgId);
};

const inviteMember = async (userId, orgId, { email, role }) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const requester = await model.getMember(orgId, userId);
  assertRole(requester, ['owner', 'admin']);

  const targetUser = await findUserByEmail(email);
  if (!targetUser) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = await model.getMember(orgId, targetUser.id);
  if (existing) {
    const err = new Error('User is already a member');
    err.statusCode = 409;
    throw err;
  }

  return model.addMember(orgId, targetUser.id, role || 'member', userId);
};

const updateMemberRole = async (userId, orgId, targetUserId, role) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const requester = await model.getMember(orgId, userId);
  assertRole(requester, ['owner', 'admin']);

  const target = await model.getMember(orgId, targetUserId);
  if (!target) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  if (target.role === 'owner') {
    const err = new Error('Cannot change owner role');
    err.statusCode = 403;
    throw err;
  }

  return model.updateMemberRole(orgId, targetUserId, role);
};

const removeMember = async (userId, orgId, targetUserId) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const requester = await model.getMember(orgId, userId);
  assertRole(requester, ['owner', 'admin']);

  const target = await model.getMember(orgId, targetUserId);
  if (!target) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  if (target.role === 'owner') {
    const err = new Error('Cannot remove owner');
    err.statusCode = 403;
    throw err;
  }

  await model.removeMember(orgId, targetUserId);
};

const getMembers = async (userId, orgId) => {
  const org = await model.findOrgById(orgId);
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }
  const member = await model.getMember(orgId, userId);
  if (!member) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  return model.getMembers(orgId);
};

module.exports = {
  createOrg,
  getOrg,
  getUserOrgs,
  updateOrg,
  deleteOrg,
  inviteMember,
  updateMemberRole,
  removeMember,
  getMembers,
};
