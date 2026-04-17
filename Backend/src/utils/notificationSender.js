const model = require('../modules/notifications/notifications.model');
const { pushSSE } = require('./sseClients');
const { query } = require('../configs/postgres');

/**
 * Fire-and-forget notification sender.
 * Writes to DB, then pushes via SSE if the recipient is currently connected.
 * Never throws — a notification failure must never break the main request.
 */
const sendNotification = async ({ userId, type, title, message, entityType = null, entityId = null }) => {
  try {
    const notif = await model.createNotification({ userId, type, title, message, entityType, entityId });
    pushSSE(String(userId), notif);
  } catch (err) {
    console.error('[notificationSender] Failed:', err.message);
  }
};

/**
 * Broadcast a card activity event to all board members currently connected via SSE.
 * Used by activityLogger after every INSERT so the Card Detail modal updates live.
 * Never throws — a broadcast failure must never break the main request.
 */
const broadcastCardActivity = async (boardId, activityRow) => {
  try {
    const result = await query(
      'SELECT user_id FROM board_members WHERE board_id = $1',
      [boardId]
    );
    const payload = { topic: 'card_activity', ...activityRow };
    result.rows.forEach(({ user_id }) => pushSSE(String(user_id), payload));
  } catch (err) {
    console.error('[broadcastCardActivity] Failed:', err.message);
  }
};

module.exports = { sendNotification, broadcastCardActivity };
