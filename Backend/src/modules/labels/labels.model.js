const { query } = require('../../configs/postgres');

const findLabelsByBoardId = async (boardId) => {
  const result = await query(
    `SELECT * FROM labels WHERE board_id = $1 ORDER BY created_at ASC`,
    [boardId]
  );
  return result.rows;
};

const findLabelById = async (id) => {
  const result = await query(`SELECT * FROM labels WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const createLabel = async (boardId, name, color) => {
  const result = await query(
    `INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING *`,
    [boardId, name || null, color]
  );
  return result.rows[0];
};

const updateLabel = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findLabelById(id);
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const result = await query(
    `UPDATE labels SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const deleteLabel = async (id) => {
  await query(`DELETE FROM labels WHERE id = $1`, [id]);
};

const getCardLabels = async (cardId) => {
  const result = await query(
    `SELECT l.* FROM labels l
     JOIN card_labels cl ON cl.label_id = l.id
     WHERE cl.card_id = $1
     ORDER BY l.created_at ASC`,
    [cardId]
  );
  return result.rows;
};

const addCardLabel = async (cardId, labelId) => {
  await query(
    `INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [cardId, labelId]
  );
};

const removeCardLabel = async (cardId, labelId) => {
  await query(
    `DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2`,
    [cardId, labelId]
  );
};

module.exports = {
  findLabelsByBoardId,
  findLabelById,
  createLabel,
  updateLabel,
  deleteLabel,
  getCardLabels,
  addCardLabel,
  removeCardLabel,
};
