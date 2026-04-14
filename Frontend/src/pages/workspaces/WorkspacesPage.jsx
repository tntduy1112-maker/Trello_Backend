import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, Layout, Users } from 'lucide-react'
import { fetchWorkspaces } from '../../redux/slices/workspaceSlice'
import AppLayout from '../../components/layout/AppLayout'
import { getInitials, generateAvatarColor } from '../../utils/helpers'

function WorkspaceCard({ workspace }) {
  const navigate = useNavigate()
  const role = workspace.member_role || workspace.role
  return (
    <div className="bg-[#22272B] border border-[#2C333A] rounded-xl p-5 hover:border-[#454F59] transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: generateAvatarColor(workspace.name) }}
        >
          {workspace.logo_url
            ? <img src={workspace.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
            : getInitials(workspace.name)}
        </div>
        <div>
          <h3 className="text-white font-semibold">{workspace.name}</h3>
          {role && (
            <p className="text-xs text-[#8C9BAB] capitalize">{role}</p>
          )}
        </div>
      </div>
      {workspace.description && (
        <p className="text-sm text-[#8C9BAB] mb-4 line-clamp-2">{workspace.description}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/workspaces/${workspace.slug}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-sm transition-colors"
        >
          <Layout size={14} />
          Boards
        </button>
        <button
          onClick={() => navigate(`/workspaces/${workspace.slug}/settings`)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-sm transition-colors"
        >
          <Users size={14} />
        </button>
      </div>
    </div>
  )
}

export default function WorkspacesPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { workspaces, loading } = useSelector((state) => state.workspace)

  useEffect(() => {
    dispatch(fetchWorkspaces())
  }, [dispatch])

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Chào mừng, {user?.full_name?.split(' ')[0] || 'bạn'}!
          </h1>
          <p className="text-[#8C9BAB]">Hôm nay bạn muốn làm gì?</p>
        </div>

        {/* Workspaces */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Workspaces của bạn</h2>
            <button
              onClick={() => navigate('/workspaces/new')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-sm transition-colors"
            >
              <Plus size={14} />
              Tạo workspace mới
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} />
              ))}
              <button
                onClick={() => navigate('/workspaces/new')}
                className="bg-[#22272B] border border-dashed border-[#454F59] rounded-xl p-5 hover:border-[#596773] hover:bg-[#2C333A] transition-colors flex flex-col items-center justify-center gap-3 min-h-[160px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#2C333A] group-hover:bg-[#38424B] flex items-center justify-center transition-colors">
                  <Plus size={20} className="text-[#8C9BAB]" />
                </div>
                <p className="text-sm text-[#8C9BAB] group-hover:text-[#B6C2CF] transition-colors">
                  Tạo workspace mới
                </p>
              </button>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
