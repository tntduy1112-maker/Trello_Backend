import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as notificationService from '../../services/notification.service'

export const fetchNotificationsThunk = createAsyncThunk(
  'notification/fetch',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const res = await notificationService.getNotifications({ page, limit })
      return res.data.data // { notifications, unreadCount }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const fetchUnreadCountThunk = createAsyncThunk(
  'notification/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationService.getUnreadCount()
      return res.data.data.unreadCount
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch count')
    }
  }
)

export const markReadThunk = createAsyncThunk(
  'notification/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markNotificationRead(id)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark read')
    }
  }
)

export const markAllReadThunk = createAsyncThunk(
  'notification/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllNotificationsRead()
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all read')
    }
  }
)

export const deleteNotificationThunk = createAsyncThunk(
  'notification/delete',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(id)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification')
    }
  }
)

const initialState = {
  notifications: [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Used by SSE stream to inject real-time notifications
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.is_read) {
        state.unreadCount += 1
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
      .addCase(markReadThunk.fulfilled, (state, action) => {
        const notif = state.notifications.find((n) => n.id === action.payload)
        if (notif && !notif.is_read) {
          notif.is_read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllReadThunk.fulfilled, (state) => {
        state.notifications.forEach((n) => (n.is_read = true))
        state.unreadCount = 0
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const removed = state.notifications.find((n) => n.id === action.payload)
        state.notifications = state.notifications.filter((n) => n.id !== action.payload)
        if (removed && !removed.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
  },
})

export const { addNotification } = notificationSlice.actions
export default notificationSlice.reducer
