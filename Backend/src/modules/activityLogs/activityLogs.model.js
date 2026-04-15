const { query } = require('../../configs/postgres');

const getByBoard = async (boardId, limit = 50, offset = 0) => {
  const result = await query(
    `SELECT al.*,
       json_build_object('full_name', u.full_name, 'avatar_url', u.avatar_url) AS user
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.board_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2 OFFSET $3`,
    [boardId, limit, offset]
  );
  return result.rows;
};

const getByCard = async (cardId, limit = 50, offset = 0) => {
  const result = await query(
    `SELECT al.*,
       json_build_object('full_name', u.full_name, 'avatar_url', u.avatar_url) AS user
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.entity_type = 'card' AND al.entity_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2 OFFSET $3`,
    [cardId, limit, offset]
  );
  return result.rows;
};

module.exports = { getByBoard, getByCard };
