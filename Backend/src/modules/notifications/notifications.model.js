const { query } = require('../../configs/postgres');

const findByUserId = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

const getUnreadCount = async (userId) => {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return result.rows[0].count;
};

const markRead = async (notificationId, userId) => {
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
};

const markAllRead = async (userId) => {
  await query(
    `UPDATE notifications SET is_read = true, read_at = NOW()
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
};

const deleteNotification = async (notificationId, userId) => {
  await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
};

const createNotification = async ({ userId, type, title, message, entityType = null, entityId = null }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, type, title, message, entityType, entityId]
  );
  return result.rows[0];
};

/**
 * Check if a due_date_reminder was already sent for this card within the given hours window.
 * Used to prevent duplicate reminder spam.
 */
const hasRecentReminder = async (userId, entityId, hoursWindow = 24) => {
  const result = await query(
    `SELECT id FROM notifications
     WHERE user_id = $1
       AND entity_id = $2
       AND type = 'due_date_reminder'
       AND created_at > NOW() - ($3 * INTERVAL '1 hour')
     LIMIT 1`,
    [userId, entityId, hoursWindow]
  );
  return result.rows.length > 0;
};

module.exports = {
  findByUserId,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  createNotification,
  hasRecentReminder,
};
