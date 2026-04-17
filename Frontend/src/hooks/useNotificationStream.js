import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification } from '../redux/slices/notificationSlice'
import { injectCardActivity } from '../redux/slices/boardSlice'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

/**
 * Opens an SSE connection to /notifications/stream when the user is authenticated.
 * Pushes incoming notifications directly into Redux so the bell badge updates in real-time.
 * Automatically closes the connection on logout or component unmount.
 */
export default function useNotificationStream() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const sourceRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) {
      sourceRef.current?.close()
      sourceRef.current = null
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const source = new EventSource(`${BASE_URL}/notifications/stream?token=${token}`)

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.topic === 'card_activity') {
          dispatch(injectCardActivity(data))
        } else {
          dispatch(addNotification(data))
        }
      } catch { /* ignore malformed events */ }
    }

    source.onerror = () => {
      // EventSource auto-reconnects after error — nothing to do here
    }

    sourceRef.current = source

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [isAuthenticated, dispatch])
}
