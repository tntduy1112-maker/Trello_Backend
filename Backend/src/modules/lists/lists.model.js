const { query } = require('../../configs/postgres');

const findListsByBoardId = async (boardId) => {
  const result = await query(
    `SELECT * FROM lists WHERE board_id = $1 AND is_archived = false ORDER BY position ASC`,
    [boardId]
  );
  return result.rows;
};

const findListById = async (id) => {
  const result = await query(`SELECT * FROM lists WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const getMaxPosition = async (boardId) => {
  const result = await query(
    `SELECT COALESCE(MAX(position), 0) AS max_pos FROM lists WHERE board_id = $1`,
    [boardId]
  );
  return parseFloat(result.rows[0].max_pos);
};

const createList = async (boardId, name, position) => {
  const result = await query(
    `INSERT INTO lists (board_id, name, position) VALUES ($1, $2, $3) RETURNING *`,
    [boardId, name, position]
  );
  return result.rows[0];
};

const updateList = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findListById(id);
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const result = await query(
    `UPDATE lists SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const deleteList = async (id) => {
  await query(`DELETE FROM lists WHERE id = $1`, [id]);
};

module.exports = { findListsByBoardId, findListById, getMaxPosition, createList, updateList, deleteList };
