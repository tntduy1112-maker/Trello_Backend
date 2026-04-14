import React, { useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Bell, UserPlus, MessageSquare, Clock, AtSign, CheckCheck } from 'lucide-react'
import { markRead, markAllRead } from '../../redux/slices/notificationSlice'
import { formatRelativeTime } from '../../utils/helpers'
import { NOTIFICATION_TYPE } from '../../data/constants'

const typeIcon = {
  [NOTIFICATION_TYPE.CARD_ASSIGNED]: <UserPlus size={16} className="text-blue-400" />,
  [NOTIFICATION_TYPE.COMMENT_ADDED]: <MessageSquare size={16} className="text-green-400" />,
  [NOTIFICATION_TYPE.DUE_DATE_REMINDER]: <Clock size={16} className="text-yellow-400" />,
  [NOTIFICATION_TYPE.MENTIONED]: <AtSign size={16} className="text-purple-400" />,
}

export default function NotificationDropdown({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const { notifications, unreadCount } = useSelector((state) => state.notification)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-96 bg-[#282E33] border border-[#454F59] rounded-xl shadow-2xl z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#454F59]">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#B6C2CF]" />
          <h3 className="text-sm font-semibold text-white">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllRead())}
            className="flex items-center gap-1 text-xs text-[#0C66E4] hover:text-blue-300 transition-colors"
          >
            <CheckCheck size={14} />
            Đọc tất cả
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-[#38424B]">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-[#8C9BAB] text-sm">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => dispatch(markRead(notif.id))}
              className={`
                w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#2C333A] transition-colors
                ${!notif.is_read ? 'bg-[#0C66E4]/5' : ''}
              `}
            >
              <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-[#38424B] flex items-center justify-center">
                {typeIcon[notif.type] || <Bell size={16} className="text-[#8C9BAB]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!notif.is_read ? 'text-white' : 'text-[#B6C2CF]'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-[#8C9BAB] mt-0.5 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-xs text-[#596773] mt-1">
                  {formatRelativeTime(notif.created_at)}
                </p>
              </div>
              {!notif.is_read && (
                <div className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-[#0C66E4]" />
              )}
            </button>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-[#454F59] text-center">
        <button className="text-xs text-[#0C66E4] hover:text-blue-300 transition-colors">
          Xem tất cả thông báo
        </button>
      </div>
    </div>
  )
}
