const { query } = require('../configs/postgres');
const { broadcastCardActivity } = require('./notificationSender');

/**
 * Fire-and-forget activity log insert.
 * Inserts the row and retrieves it with user info in a single CTE query,
 * then broadcasts the enriched row to all board members via SSE.
 * Never throws — a logging failure must never break the main request.
 */
const logActivity = async ({ userId, entityType, entityId, boardId, action, metadata = null }) => {
  try {
    const result = await query(
      `WITH inserted AS (
         INSERT INTO activity_logs (user_id, entity_type, entity_id, board_id, action, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *
       )
       SELECT i.*,
              json_build_object('full_name', u.full_name, 'avatar_url', u.avatar_url) AS "user"
       FROM inserted i
       LEFT JOIN users u ON u.id = i.user_id`,
      [userId || null, entityType, entityId, boardId || null, action, metadata ? JSON.stringify(metadata) : null]
    );

    const activityRow = result.rows[0];
    if (activityRow && boardId) {
      broadcastCardActivity(boardId, activityRow).catch(() => {});
    }
  } catch (err) {
    console.error('[activityLogger] Failed to log activity:', err.message);
  }
};

module.exports = { logActivity };
