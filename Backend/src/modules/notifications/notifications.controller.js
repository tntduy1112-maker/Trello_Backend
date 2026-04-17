const service = require('./notifications.service');
const { success } = require('../../utils/response');

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const data = await service.getNotifications(req.user.userId, { page, limit });
    return success(res, data);
  } catch (err) { next(err); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await service.getUnreadCount(req.user.userId);
    return success(res, { unreadCount: count });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notif = await service.markRead(req.user.userId, req.params.id);
    return success(res, { notification: notif });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await service.markAllRead(req.user.userId);
    return success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await service.deleteNotification(req.user.userId, req.params.id);
    return success(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
