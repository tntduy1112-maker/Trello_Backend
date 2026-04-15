const { query } = require('../configs/postgres');

/**
 * Fire-and-forget activity log insert.
 * Never throws — a logging failure must never break the main request.
 */
const logActivity = async ({ userId, entityType, entityId, boardId, action, metadata = null }) => {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, entity_type, entity_id, board_id, action, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, entityType, entityId, boardId || null, action, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    console.error('[activityLogger] Failed to log activity:', err.message);
  }
};

module.exports = { logActivity };
