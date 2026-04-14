import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ArrowLeft, Trash2, Save, UserMinus, UserPlus, X, Check } from 'lucide-react'
import { fetchWorkspaces, updateWorkspaceThunk, deleteWorkspaceThunk } from '../../redux/slices/workspaceSlice'
import * as workspaceService from '../../services/workspace.service'
import AppLayout from '../../components/layout/AppLayout'
import Avatar from '../../components/ui/Avatar'
import { generateAvatarColor, getInitials } from '../../utils/helpers'

export default function WorkspaceSettingsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { workspaces } = useSelector((state) => state.workspace)

  const workspace = workspaces.find((w) => w.slug === slug)

  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    if (workspaces.length === 0) dispatch(fetchWorkspaces())
  }, [dispatch, workspaces.length])

  useEffect(() => {
    if (workspace) {
      setForm({ name: workspace.name, description: workspace.description || '' })
    }
  }, [workspace?.id])

  useEffect(() => {
    if (!workspace?.id) return
    setLoadingMembers(true)
    workspaceService.getWorkspaceMembers(workspace.id)
      .then((res) => setMembers(res.data.data.members || []))
      .catch(console.error)
      .finally(() => setLoadingMembers(false))
  }, [workspace?.id])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!workspace) return
    setSaving(true)
    setSaveError('')
    try {
      await dispatch(updateWorkspaceThunk({
        id: workspace.id,
        data: { name: form.name.trim(), description: form.description.trim() || undefined },
      }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('Lưu thất bại. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!workspace) return
    if (!window.confirm(`Xóa workspace "${workspace.name}"? Hành động này không thể hoàn tác.`)) return
    setDeleting(true)
    try {
      await dispatch(deleteWorkspaceThunk(workspace.id))
      navigate('/home')
    } catch {
      alert('Xóa workspace thất bại.')
    } finally {
      setDeleting(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteForm.email.trim()) { setInviteError('Email là bắt buộc'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) { setInviteError('Email không hợp lệ'); return }
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      const res = await workspaceService.inviteMember(workspace.id, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      })
      const newMember = res.data.data.member
      setMembers((prev) => [...prev, newMember])
      setInviteSuccess(`Đã thêm ${newMember.full_name || inviteForm.email} vào workspace!`)
      setInviteForm({ email: '', role: 'member' })
      setTimeout(() => {
        setInviteSuccess('')
        setShowInviteForm(false)
      }, 2000)
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Không thể thêm thành viên. Vui lòng thử lại.')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (memberId, role) => {
    if (!workspace) return
    try {
      await workspaceService.updateMemberRole(workspace.id, memberId, role)
      setMembers((prev) => prev.map((m) => m.user_id === memberId ? { ...m, role } : m))
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật vai trò thất bại')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!workspace) return
    if (!window.confirm('Xóa thành viên này?')) return
    try {
      await workspaceService.removeMember(workspace.id, memberId)
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId))
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thành viên thất bại')
    }
  }

  if (!workspace) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/workspaces/${slug}`)}
          className="flex items-center gap-2 text-sm text-[#8C9BAB] hover:text-[#B6C2CF] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại Boards
        </button>

        <h1 className="text-xl font-bold text-white mb-6">Cài đặt Workspace</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2C333A] mb-6">
          {['general', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
                activeTab === tab ? 'text-white border-b-2 border-[#0C66E4]' : 'text-[#8C9BAB] hover:text-[#B6C2CF]'
              }`}
            >
              {tab === 'general' ? 'Chung' : 'Thành viên'}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-[#22272B] border border-[#2C333A] rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">Thông tin workspace</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: generateAvatarColor(form.name || workspace.name) }}
                  >
                    {getInitials(form.name || workspace.name)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B6C2CF] mb-1">Tên workspace</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#1D2125] border border-[#454F59] rounded-lg text-[#B6C2CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B6C2CF] mb-1">Mô tả</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-[#1D2125] border border-[#454F59] rounded-lg text-[#B6C2CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] resize-none"
                  />
                </div>
                {saveError && <p className="text-sm text-red-400">{saveError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : <Save size={14} />}
                  {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>

            {/* Danger zone */}
            <div className="bg-[#22272B] border border-red-900/50 rounded-xl p-6">
              <h2 className="text-base font-semibold text-red-400 mb-2">Vùng nguy hiểm</h2>
              <p className="text-sm text-[#8C9BAB] mb-4">Xóa workspace sẽ xóa tất cả boards và dữ liệu liên quan. Hành động này không thể hoàn tác.</p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deleting ? 'Đang xóa...' : 'Xóa workspace'}
              </button>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-[#22272B] border border-[#2C333A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2C333A] flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Thành viên ({members.length})</h2>
              <button
                onClick={() => { setShowInviteForm((v) => !v); setInviteError(''); setInviteSuccess('') }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-sm font-medium transition-colors"
              >
                {showInviteForm ? <X size={14} /> : <UserPlus size={14} />}
                {showInviteForm ? 'Đóng' : 'Thêm thành viên'}
              </button>
            </div>

            {/* Invite form — slides in below header */}
            {showInviteForm && (
              <div className="p-4 border-b border-[#2C333A] bg-[#1D2125]">
                <p className="text-sm font-medium text-[#B6C2CF] mb-3">
                  Nhập email của thành viên đã có tài khoản TaskFlow
                </p>
                <form onSubmit={handleInvite} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => { setInviteForm((f) => ({ ...f, email: e.target.value })); setInviteError('') }}
                      placeholder="email@example.com"
                      autoFocus
                      className={`w-full px-3 py-2 bg-[#22272B] border rounded-lg text-[#B6C2CF] placeholder-[#596773] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${
                        inviteError ? 'border-red-500' : 'border-[#454F59]'
                      }`}
                    />
                    {inviteError && <p className="mt-1 text-xs text-red-400">{inviteError}</p>}
                    {inviteSuccess && (
                      <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                        <Check size={12} /> {inviteSuccess}
                      </p>
                    )}
                  </div>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                    className="px-3 py-2 bg-[#22272B] border border-[#454F59] text-[#B6C2CF] text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {inviting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : <UserPlus size={14} />}
                    Thêm
                  </button>
                </form>
              </div>
            )}

            {loadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2C333A]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#8C9BAB]">Thành viên</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#8C9BAB]">Vai trò</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-[#2C333A] hover:bg-[#2C333A] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-white">{member.full_name}</p>
                            <p className="text-xs text-[#8C9BAB]">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={member.role}
                          disabled={member.role === 'owner'}
                          onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                          className="bg-[#2C333A] border border-[#454F59] text-[#B6C2CF] text-xs rounded-lg px-2 py-1 focus:outline-none disabled:opacity-50"
                        >
                          {['member', 'admin'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                          {member.role === 'owner' && <option value="owner">owner</option>}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-[#8C9BAB] hover:text-red-400 transition-colors p-1"
                          >
                            <UserMinus size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
