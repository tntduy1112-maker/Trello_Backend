import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Mail, Plus, X, UserCheck, Clock, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { inviteBoardMember, getPendingInvitations, revokeInvitation } from '../../services/board.service'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Thành viên' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'viewer', label: 'Chỉ xem' },
]

export default function InviteMemberModal({ isOpen, onClose }) {
  const { boardId } = useParams()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [pendingInvites, setPendingInvites] = useState([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [revokingId, setRevokingId] = useState(null)

  useEffect(() => {
    if (!isOpen || !boardId) return
    setLoadingInvites(true)
    getPendingInvitations(boardId)
      .then((res) => setPendingInvites(res.data.data.invitations || []))
      .catch(() => {})
      .finally(() => setLoadingInvites(false))
  }, [isOpen, boardId])

  const handleInvite = async () => {
    if (!email.trim()) { setError('Vui lòng nhập email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email không hợp lệ'); return }
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await inviteBoardMember(boardId, { email: email.trim(), role })
      const { status, member, email: invitedEmail } = res.data.data

      if (status === 'added') {
        setSuccessMsg(`✓ Đã thêm ${member.full_name || email} vào board`)
      } else {
        setSuccessMsg(`✓ Lời mời đã gửi tới ${invitedEmail}`)
        // Refresh pending list
        getPendingInvitations(boardId)
          .then((r) => setPendingInvites(r.data.data.invitations || []))
          .catch(() => {})
      }
      setEmail('')
      setRole('member')
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lời mời. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (invitationId) => {
    setRevokingId(invitationId)
    try {
      await revokeInvitation(boardId, invitationId)
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invitationId))
    } catch {
      // silently ignore
    } finally {
      setRevokingId(null)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('member')
    setError('')
    setSuccessMsg('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mời thành viên" size="md">
      <div className="p-4 space-y-4">
        {/* Input row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BAB]" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
                placeholder="Nhập địa chỉ email..."
                className={`w-full pl-9 pr-3 py-2 bg-[#1D2125] border rounded-lg text-sm text-[#B6C2CF] placeholder-[#596773] focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${error ? 'border-red-500' : 'border-[#454F59]'}`}
              />
            </div>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-2 py-2 bg-[#1D2125] border border-[#454F59] rounded-lg text-sm text-[#B6C2CF] focus:outline-none"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <button
            onClick={handleInvite}
            disabled={loading}
            className="px-3 py-2 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Plus size={14} /> Mời</>
            )}
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 bg-green-900/30 border border-green-700/40 rounded-lg text-xs text-green-400">
            <UserCheck size={13} />
            {successMsg}
          </div>
        )}

        {/* Pending invitations */}
        {loadingInvites ? (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingInvites.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide flex items-center gap-1">
              <Clock size={11} /> Lời mời đang chờ ({pendingInvites.length})
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-[#22272B] rounded-xl">
                  <div>
                    <p className="text-sm text-[#B6C2CF]">{inv.email}</p>
                    <p className="text-xs text-[#596773] capitalize">{inv.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 rounded-full">
                      Chờ xác nhận
                    </span>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revokingId === inv.id}
                      className="p-1 text-[#596773] hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Thu hồi lời mời"
                    >
                      {revokingId === inv.id ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
