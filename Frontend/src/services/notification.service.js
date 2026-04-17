import api from '../api/axiosInstance'

export const getNotifications = ({ page = 1, limit = 20 } = {}) =>
  api.get('/notifications', { params: { page, limit } })

export const getUnreadCount = () => api.get('/notifications/unread-count')

export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`)

export const markAllNotificationsRead = () => api.put('/notifications/read-all')

export const deleteNotification = (id) => api.delete(`/notifications/${id}`)
