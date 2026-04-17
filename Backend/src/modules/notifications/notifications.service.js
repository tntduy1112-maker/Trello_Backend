const model = require('./notifications.model');

const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [notifications, unreadCount] = await Promise.all([
    model.findByUserId(userId, limit, offset),
    model.getUnreadCount(userId),
  ]);
  return { notifications, unreadCount };
};

const getUnreadCount = async (userId) => {
  return model.getUnreadCount(userId);
};

const markRead = async (userId, notificationId) => {
  const notif = await model.markRead(notificationId, userId);
  if (!notif) {
    const e = new Error('Notification not found');
    e.statusCode = 404;
    throw e;
  }
  return notif;
};

const markAllRead = async (userId) => {
  await model.markAllRead(userId);
};

const deleteNotification = async (userId, notificationId) => {
  await model.deleteNotification(notificationId, userId);
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
