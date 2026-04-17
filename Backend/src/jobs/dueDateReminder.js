const cron = require('node-cron');
const { query } = require('../configs/postgres');
const { sendNotification } = require('../utils/notificationSender');
const { hasRecentReminder } = require('../modules/notifications/notifications.model');

/**
 * Query all non-completed cards with an assignee whose due_date falls
 * within the next 24 hours, then send a reminder notification to the assignee
 * if one hasn't been sent in the last 24 hours (deduplication guard).
 */
const runDueDateReminder = async () => {
  try {
    const result = await query(
      `SELECT c.id, c.title, c.due_date, cm.user_id AS assignee_id
       FROM cards c
       JOIN card_members cm ON cm.card_id = c.id
       WHERE c.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
         AND c.is_completed = false
         AND c.is_archived  = false`
    );

    for (const card of result.rows) {
      const alreadySent = await hasRecentReminder(card.assignee_id, card.id);
      if (alreadySent) continue;

      const dueDateStr = new Date(card.due_date).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      await sendNotification({
        userId:     card.assignee_id,
        type:       'due_date_reminder',
        title:      'Sắp đến deadline',
        message:    `Card "${card.title}" đến hạn vào ${dueDateStr}`,
        entityType: 'card',
        entityId:   card.id,
      });
    }
  } catch (err) {
    console.error('[dueDateReminder] Error:', err.message);
  }
};

/**
 * Start the due-date reminder cron job.
 * Runs at the top of every hour (e.g. 09:00, 10:00, …).
 */
const startDueDateReminder = () => {
  cron.schedule('0 * * * *', runDueDateReminder);
  console.log('[dueDateReminder] Scheduled — runs every hour');
};

module.exports = { startDueDateReminder };
