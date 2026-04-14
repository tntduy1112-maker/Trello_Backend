import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import boardReducer from './slices/boardSlice'
import notificationReducer from './slices/notificationSlice'
import workspaceReducer from './slices/workspaceSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    notification: notificationReducer,
    workspace: workspaceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['notification.notifications'],
        ignoredActionPaths: ['payload.created_at'],
      },
    }),
})

export default store
