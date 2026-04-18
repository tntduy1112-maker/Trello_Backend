import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification } from '../redux/slices/notificationSlice'
import { injectCardActivity, setStreamPaused } from '../redux/slices/boardSlice'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

/**
 * Opens an SSE connection to /notifications/stream when the user is authenticated.
 * - Routes card_activity and card_activity_batch events to boardSlice.
 * - Routes notification events to notificationSlice.
 * - Tracks reconnects: dispatches setStreamPaused(true) on error and
 *   setStreamPaused(false) on reconnect (which also triggers a refetch in
 *   CardDetailModal via streamReconnectedAt).
 */
export default function useNotificationStream() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const sourceRef   = useRef(null)
  const isFirstOpen = useRef(true)  // true until the first successful onopen

  useEffect(() => {
    if (!isAuthenticated) {
      sourceRef.current?.close()
      sourceRef.current = null
      isFirstOpen.current = true
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const source = new EventSource(`${BASE_URL}/notifications/stream?token=${token}`)

    source.onopen = () => {
      if (!isFirstOpen.current) {
        // This is a reconnect after a drop — clear the banner and signal a refetch
        dispatch(setStreamPaused(false))
      }
      isFirstOpen.current = false
    }

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.topic === 'card_activity') {
          dispatch(injectCardActivity(data))
        } else if (data.topic === 'card_activity_batch') {
          // Flush each batched event individually; injectCardActivity deduplicates by id
          data.events.forEach((event) => dispatch(injectCardActivity(event)))
        } else {
          dispatch(addNotification(data))
        }
      } catch { /* ignore malformed events */ }
    }

    source.onerror = () => {
      // EventSource will auto-reconnect; show the paused banner while disconnected
      dispatch(setStreamPaused(true))
    }

    sourceRef.current = source

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [isAuthenticated, dispatch])
}
