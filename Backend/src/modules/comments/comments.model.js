const { query } = require('../../configs/postgres');

const findByCardId = async (cardId) => {
  const result = await query(
    `SELECT c.*,
       json_build_object('id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url) AS user,
       COALESCE(replies.data, '[]') AS replies
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN LATERAL (
       SELECT json_agg(
         json_build_object(
           'id', r.id,
           'content', r.content,
           'is_edited', r.is_edited,
           'created_at', r.created_at,
           'updated_at', r.updated_at,
           'user_id', r.user_id,
           'user', json_build_object('id', ru.id, 'full_name', ru.full_name, 'avatar_url', ru.avatar_url)
         ) ORDER BY r.created_at ASC
       ) AS data
       FROM comments r
       LEFT JOIN users ru ON ru.id = r.user_id
       WHERE r.parent_id = c.id
     ) replies ON true
     WHERE c.card_id = $1 AND c.parent_id IS NULL
     ORDER BY c.created_at ASC`,
    [cardId]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await query(`SELECT * FROM comments WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const createComment = async (cardId, userId, content, parentId = null) => {
  const result = await query(
    `INSERT INTO comments (card_id, user_id, content, parent_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [cardId, userId, content, parentId]
  );
  return result.rows[0];
};

const updateComment = async (id, content) => {
  const result = await query(
    `UPDATE comments SET content = $2, is_edited = true, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, content]
  );
  return result.rows[0] || null;
};

const deleteComment = async (id) => {
  await query(`DELETE FROM comments WHERE id = $1`, [id]);
};

module.exports = { findByCardId, findById, createComment, updateComment, deleteComment };
