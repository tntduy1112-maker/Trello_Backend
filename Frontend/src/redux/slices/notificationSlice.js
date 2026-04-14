import { createSlice } from '@reduxjs/toolkit'
import { mockNotifications } from '../../data/mockData'

const initialState = {
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.is_read).length,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter((n) => !n.is_read).length
    },
    markRead: (state, action) => {
      const id = action.payload
      const notif = state.notifications.find((n) => n.id === id)
      if (notif && !notif.is_read) {
        notif.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => (n.is_read = true))
      state.unreadCount = 0
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.is_read) {
        state.unreadCount += 1
      }
    },
  },
})

export const { setNotifications, markRead, markAllRead, addNotification } = notificationSlice.actions
export default notificationSlice.reducer
