const { query } = require('../../configs/postgres');

const createOrganization = async (name, slug, description, logoUrl, createdBy) => {
  const result = await query(
    `INSERT INTO organizations (name, slug, description, logo_url, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, slug, description || null, logoUrl || null, createdBy]
  );
  return result.rows[0];
};

const findOrgById = async (id) => {
  const result = await query(`SELECT * FROM organizations WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const findOrgsByUserId = async (userId) => {
  const result = await query(
    `SELECT o.*, om.role AS member_role
     FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE om.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const updateOrganization = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findOrgById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);

  const result = await query(
    `UPDATE organizations SET ${setClauses}, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const deleteOrganization = async (id) => {
  await query(`DELETE FROM organizations WHERE id = $1`, [id]);
};

const addMember = async (organizationId, userId, role, invitedBy) => {
  const result = await query(
    `INSERT INTO organization_members (organization_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [organizationId, userId, role, invitedBy || null]
  );
  return result.rows[0];
};

const getMember = async (organizationId, userId) => {
  const result = await query(
    `SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, userId]
  );
  return result.rows[0] || null;
};

const getMembers = async (organizationId) => {
  const result = await query(
    `SELECT om.*, u.email, u.full_name, u.avatar_url
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1
     ORDER BY om.joined_at ASC`,
    [organizationId]
  );
  return result.rows;
};

const updateMemberRole = async (organizationId, userId, role) => {
  const result = await query(
    `UPDATE organization_members SET role = $3
     WHERE organization_id = $1 AND user_id = $2
     RETURNING *`,
    [organizationId, userId, role]
  );
  return result.rows[0] || null;
};

const removeMember = async (organizationId, userId) => {
  await query(
    `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, userId]
  );
};

module.exports = {
  createOrganization,
  findOrgById,
  findOrgsByUserId,
  updateOrganization,
  deleteOrganization,
  addMember,
  getMember,
  getMembers,
  updateMemberRole,
  removeMember,
};
