const { query } = require('../../configs/postgres');

// ── Checklists ────────────────────────────────────────────────────────────────

const findByCardId = async (cardId) => {
  const result = await query(
    `SELECT cl.*,
       COALESCE(items.data, '[]') AS items
     FROM checklists cl
     LEFT JOIN LATERAL (
       SELECT json_agg(
         json_build_object(
           'id',           ci.id,
           'content',      ci.content,
           'is_completed', ci.is_completed,
           'position',     ci.position,
           'assigned_to',  ci.assigned_to,
           'due_date',     ci.due_date,
           'completed_at', ci.completed_at,
           'created_at',   ci.created_at
         ) ORDER BY ci.position ASC
       ) AS data
       FROM checklist_items ci
       WHERE ci.checklist_id = cl.id
     ) items ON true
     WHERE cl.card_id = $1
     ORDER BY cl.position ASC`,
    [cardId]
  );
  return result.rows;
};

const findChecklistById = async (id) => {
  const result = await query(`SELECT * FROM checklists WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const getMaxChecklistPosition = async (cardId) => {
  const result = await query(
    `SELECT COALESCE(MAX(position), 0) AS max_pos FROM checklists WHERE card_id = $1`,
    [cardId]
  );
  return parseFloat(result.rows[0].max_pos);
};

const createChecklist = async (cardId, title, position) => {
  const result = await query(
    `INSERT INTO checklists (card_id, title, position) VALUES ($1, $2, $3) RETURNING *`,
    [cardId, title, position]
  );
  return { ...result.rows[0], items: [] };
};

const updateChecklist = async (id, title) => {
  const result = await query(
    `UPDATE checklists SET title = $2 WHERE id = $1 RETURNING *`,
    [id, title]
  );
  return result.rows[0] || null;
};

const deleteChecklist = async (id) => {
  await query(`DELETE FROM checklists WHERE id = $1`, [id]);
};

// ── Checklist Items ───────────────────────────────────────────────────────────

const findItemById = async (id) => {
  const result = await query(`SELECT * FROM checklist_items WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const getMaxItemPosition = async (checklistId) => {
  const result = await query(
    `SELECT COALESCE(MAX(position), 0) AS max_pos FROM checklist_items WHERE checklist_id = $1`,
    [checklistId]
  );
  return parseFloat(result.rows[0].max_pos);
};

const createItem = async (checklistId, content, position) => {
  const result = await query(
    `INSERT INTO checklist_items (checklist_id, content, position) VALUES ($1, $2, $3) RETURNING *`,
    [checklistId, content, position]
  );
  return result.rows[0];
};

const updateItem = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findItemById(id);
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const result = await query(
    `UPDATE checklist_items SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const deleteItem = async (id) => {
  await query(`DELETE FROM checklist_items WHERE id = $1`, [id]);
};

module.exports = {
  findByCardId,
  findChecklistById,
  getMaxChecklistPosition,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  findItemById,
  getMaxItemPosition,
  createItem,
  updateItem,
  deleteItem,
};
