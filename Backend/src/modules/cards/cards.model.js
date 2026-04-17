const { query } = require('../../configs/postgres');

const findCardsByListId = async (listId) => {
  const result = await query(
    `SELECT c.*,
       COALESCE(m.assignees, '[]') AS assignees,
       COALESCE(l.labels,    '[]') AS labels,
       (SELECT COUNT(*)::int FROM attachments WHERE card_id = c.id) AS attachment_count,
       (SELECT json_build_object(
         'total',     COUNT(ci.id)::int,
         'completed', COUNT(ci.id) FILTER (WHERE ci.is_completed)::int
       ) FROM checklists cl JOIN checklist_items ci ON ci.checklist_id = cl.id
       WHERE cl.card_id = c.id) AS checklist_progress
     FROM cards c
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object(
         'user_id', cm.user_id,
         'full_name', u.full_name,
         'avatar_url', u.avatar_url,
         'email', u.email
       )) AS assignees
       FROM card_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.card_id = c.id
     ) m ON true
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object(
         'id', lbl.id,
         'name', lbl.name,
         'color', lbl.color
       )) AS labels
       FROM card_labels cl
       JOIN labels lbl ON lbl.id = cl.label_id
       WHERE cl.card_id = c.id
     ) l ON true
     WHERE c.list_id = $1 AND c.is_archived = false
     ORDER BY c.position ASC`,
    [listId]
  );
  return result.rows;
};

const findCardById = async (id) => {
  const result = await query(
    `SELECT c.*,
       COALESCE(m.assignees, '[]') AS assignees,
       COALESCE(l.labels,    '[]') AS labels,
       (SELECT COUNT(*)::int FROM attachments WHERE card_id = c.id) AS attachment_count,
       (SELECT json_build_object(
         'total',     COUNT(ci.id)::int,
         'completed', COUNT(ci.id) FILTER (WHERE ci.is_completed)::int
       ) FROM checklists cl JOIN checklist_items ci ON ci.checklist_id = cl.id
       WHERE cl.card_id = c.id) AS checklist_progress
     FROM cards c
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object(
         'user_id', cm.user_id,
         'full_name', u.full_name,
         'avatar_url', u.avatar_url,
         'email', u.email
       )) AS assignees
       FROM card_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.card_id = c.id
     ) m ON true
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object(
         'id', lbl.id,
         'name', lbl.name,
         'color', lbl.color
       )) AS labels
       FROM card_labels cl
       JOIN labels lbl ON lbl.id = cl.label_id
       WHERE cl.card_id = c.id
     ) l ON true
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const getMaxPosition = async (listId) => {
  const result = await query(
    `SELECT COALESCE(MAX(position), 0) AS max_pos FROM cards WHERE list_id = $1`,
    [listId]
  );
  return parseFloat(result.rows[0].max_pos);
};

const createCard = async (listId, boardId, title, position, createdBy) => {
  const result = await query(
    `INSERT INTO cards (list_id, board_id, title, position, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [listId, boardId, title, position, createdBy]
  );
  return result.rows[0];
};

const updateCard = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findCardById(id);
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const result = await query(
    `UPDATE cards SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const deleteCard = async (id) => {
  await query(`DELETE FROM cards WHERE id = $1`, [id]);
};

const setCardMember = async (cardId, userId, assignedBy) => {
  await query(
    `INSERT INTO card_members (card_id, user_id, assigned_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (card_id, user_id) DO UPDATE SET assigned_by = $3`,
    [cardId, userId, assignedBy]
  );
};

const removeCardMembers = async (cardId) => {
  await query(`DELETE FROM card_members WHERE card_id = $1`, [cardId]);
};

module.exports = {
  findCardsByListId,
  findCardById,
  getMaxPosition,
  createCard,
  updateCard,
  deleteCard,
  setCardMember,
  removeCardMembers,
};
