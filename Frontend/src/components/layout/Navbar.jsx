import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Bell, Search, ChevronDown, User, LogOut, Settings, Zap } from 'lucide-react'
import { logout } from '../../redux/slices/authSlice'
import Avatar from '../ui/Avatar'
import NotificationDropdown from '../ui/NotificationDropdown'
import Dropdown from '../ui/Dropdown'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notification)
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const userMenuItems = [
    {
      label: user?.full_name || 'Profile',
      icon: <User size={15} />,
      onClick: () => navigate('/profile'),
    },
    { separator: true },
    {
      label: 'Đăng xuất',
      icon: <LogOut size={15} />,
      onClick: handleLogout,
      danger: true,
    },
  ]

  return (
    <header className="h-12 bg-[#1D2125] border-b border-[#2C333A] flex items-center px-4 gap-4 z-40 fixed top-0 left-0 right-0">
      {/* Logo */}
      <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 bg-[#0C66E4] rounded flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-white font-bold text-base hidden sm:block">TaskFlow</span>
      </Link>

      {/* Center Search */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BAB]" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full h-8 bg-[#22272B] border border-[#454F59] rounded text-sm text-[#B6C2CF] placeholder-[#8C9BAB] pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#0C66E4] focus:border-[#0C66E4] transition-colors"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="w-8 h-8 rounded flex items-center justify-center text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white transition-colors relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User avatar dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#2C333A] transition-colors">
              <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
              <ChevronDown size={14} className="text-[#8C9BAB] hidden sm:block" />
            </div>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  )
}
