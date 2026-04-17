import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Layout, Settings, Plus, ChevronDown, ChevronRight,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import { getInitials, generateAvatarColor } from '../../utils/helpers'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { workspaces } = useSelector((state) => state.workspace)
  const [expandedWorkspace, setExpandedWorkspace] = useState(null)

  const isActive = (path) => location.pathname === path
  const isStartsWith = (path) => location.pathname.startsWith(path)

  return (
    <aside className="w-64 bg-[#1D2125] border-r border-[#2C333A] flex flex-col h-full overflow-y-auto">
      {/* User Section */}
      <div className="p-3 border-b border-[#2C333A]">
        <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2C333A] transition-colors">
          <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-[#8C9BAB] truncate">{user?.email}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {/* Home */}
        <Link
          to="/home"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive('/home')
              ? 'bg-[#0C66E4]/20 text-[#0C66E4] font-medium'
              : 'text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white'
          }`}
        >
          <Layout size={16} />
          Trang chủ
        </Link>

        {/* Workspaces heading */}
        <div className="pt-4 pb-1">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-[#596773] uppercase tracking-wider">Workspaces</span>
            <button
              onClick={() => navigate('/workspaces/new')}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2C333A] text-[#596773] hover:text-[#B6C2CF] transition-colors"
              title="Tạo workspace mới"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Workspace list */}
        {workspaces.map((ws) => (
          <div key={ws.id}>
            <button
              onClick={() => setExpandedWorkspace(expandedWorkspace === ws.id ? null : ws.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isStartsWith(`/workspaces/${ws.slug}`)
                  ? 'bg-[#2C333A] text-white'
                  : 'text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white'
              }`}
            >
              {/* Workspace Icon */}
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: generateAvatarColor(ws.name) }}
              >
                {getInitials(ws.name)}
              </div>
              <span className="flex-1 text-left truncate">{ws.name}</span>
              {expandedWorkspace === ws.id
                ? <ChevronDown size={14} className="flex-shrink-0 text-[#596773]" />
                : <ChevronRight size={14} className="flex-shrink-0 text-[#596773]" />
              }
            </button>

            {/* Expanded workspace items */}
            {expandedWorkspace === ws.id && (
              <div className="ml-4 mt-1 space-y-0.5">
                <Link
                  to={`/workspaces/${ws.slug}`}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive(`/workspaces/${ws.slug}`)
                      ? 'bg-[#0C66E4]/20 text-[#0C66E4]'
                      : 'text-[#8C9BAB] hover:bg-[#2C333A] hover:text-[#B6C2CF]'
                  }`}
                >
                  <Layout size={14} />
                  Boards
                </Link>
                <Link
                  to={`/workspaces/${ws.slug}/settings`}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive(`/workspaces/${ws.slug}/settings`)
                      ? 'bg-[#0C66E4]/20 text-[#0C66E4]'
                      : 'text-[#8C9BAB] hover:bg-[#2C333A] hover:text-[#B6C2CF]'
                  }`}
                >
                  <Settings size={14} />
                  Cài đặt
                </Link>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Create Workspace */}
      <div className="p-3 border-t border-[#2C333A]">
        <button
          onClick={() => navigate('/workspaces/new')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8C9BAB] hover:bg-[#2C333A] hover:text-[#B6C2CF] transition-colors"
        >
          <Plus size={16} />
          Tạo workspace mới
        </button>
      </div>
    </aside>
  )
}
