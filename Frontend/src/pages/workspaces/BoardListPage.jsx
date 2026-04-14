import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, Lock, Globe, Users, Settings } from 'lucide-react'
import { fetchWorkspaces } from '../../redux/slices/workspaceSlice'
import * as boardService from '../../services/board.service'
import * as workspaceService from '../../services/workspace.service'
import AppLayout from '../../components/layout/AppLayout'
import Avatar from '../../components/ui/Avatar'
import CreateBoardModal from '../boards/CreateBoardModal'
import { getInitials, generateAvatarColor } from '../../utils/helpers'

function BoardCard({ board, onClick, onBoardUpdate }) {
  return (
    <div
      className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all"
      style={{ backgroundColor: board.cover_color || '#22272B' }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm truncate">{board.name}</p>
        <div className="flex items-center gap-1 mt-1">
          {board.visibility === 'private' && <Lock size={10} className="text-white/70" />}
          {board.visibility === 'public' && <Globe size={10} className="text-white/70" />}
          {board.visibility === 'workspace' && <Users size={10} className="text-white/70" />}
          <span className="text-xs text-white/70 capitalize">{board.visibility}</span>
        </div>
      </div>
    </div>
  )
}

export default function BoardListPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { workspaces, loading: wsLoading } = useSelector((state) => state.workspace)
  const [activeTab, setActiveTab] = useState('boards')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [boards, setBoards] = useState([])
  const [members, setMembers] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  const workspace = workspaces.find((w) => w.slug === slug)

  // Load workspaces if not yet fetched
  useEffect(() => {
    if (workspaces.length === 0) {
      dispatch(fetchWorkspaces())
    }
  }, [dispatch, workspaces.length])

  // Load boards and members when workspace is available
  useEffect(() => {
    if (!workspace?.id) return
    setLoadingData(true)
    Promise.all([
      boardService.getBoards(workspace.id),
      workspaceService.getWorkspaceMembers(workspace.id),
    ])
      .then(([boardsRes, membersRes]) => {
        setBoards(boardsRes.data.data.boards || [])
        setMembers(membersRes.data.data.members || [])
      })
      .catch(console.error)
      .finally(() => setLoadingData(false))
  }, [workspace?.id])

  const handleBoardCreated = (newBoard) => {
    setBoards((prev) => [...prev, newBoard])
  }

  const tabs = [
    { id: 'boards', label: 'Boards' },
    { id: 'members', label: 'Thành viên' },
    { id: 'settings', label: 'Cài đặt' },
  ]

  if (wsLoading && !workspace) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!workspace) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-[#8C9BAB]">Workspace không tìm thấy.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: generateAvatarColor(workspace.name) }}
          >
            {getInitials(workspace.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
            <p className="text-sm text-[#8C9BAB]">{members.length} thành viên</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2C333A] mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                tab.id === 'settings'
                  ? navigate(`/workspaces/${slug}/settings`)
                  : setActiveTab(tab.id)
              }
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-[#0C66E4]'
                  : 'text-[#8C9BAB] hover:text-[#B6C2CF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Boards Tab */}
        {activeTab === 'boards' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#B6C2CF]">Tất cả boards</h2>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-sm transition-colors"
              >
                <Plus size={14} />
                Tạo board mới
              </button>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {boards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onClick={() => navigate(`/board/${board.id}`)}
                  />
                ))}
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="aspect-video rounded-xl bg-[#2C333A] hover:bg-[#38424B] border border-dashed border-[#454F59] flex items-center justify-center group transition-colors"
                >
                  <div className="text-center">
                    <Plus size={20} className="text-[#596773] group-hover:text-[#8C9BAB] mx-auto mb-1 transition-colors" />
                    <span className="text-xs text-[#596773] group-hover:text-[#8C9BAB] transition-colors">Tạo board mới</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#B6C2CF]">Thành viên ({members.length})</h2>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-[#22272B] rounded-xl border border-[#2C333A]">
                    <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{member.full_name}</p>
                      <p className="text-xs text-[#8C9BAB]">{member.email}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-[#2C333A] text-[#8C9BAB] rounded-full capitalize">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateBoardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        workspaceId={workspace.id}
        onCreated={handleBoardCreated}
      />
    </AppLayout>
  )
}
