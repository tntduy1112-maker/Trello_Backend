import React, { useState } from 'react'
import { Mail, Plus } from 'lucide-react'
import Modal from '../ui/Modal'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Thành viên' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'viewer', label: 'Xem' },
]

export default function InviteMemberModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingInvites, setPendingInvites] = useState([
    { email: 'b@example.com', role: 'member', status: 'pending' },
  ])

  const handleInvite = async () => {
    if (!email.trim()) { setError('Vui lòng nhập email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email không hợp lệ'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    setPendingInvites((p) => [...p, { email, role, status: 'pending' }])
    setEmail('')
    setError('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mời thành viên" size="md">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BAB]" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
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
            className="px-3 py-2 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Plus size={14} /> Mời</>
            )}
          </button>
        </div>

        {pendingInvites.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8C9BAB] mb-2">Lời mời đang chờ</p>
            <div className="space-y-2">
              {pendingInvites.map((invite, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#22272B] rounded-xl">
                  <div>
                    <p className="text-sm text-[#B6C2CF]">{invite.email}</p>
                    <p className="text-xs text-[#596773] capitalize">{invite.role}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 rounded-full">
                    Đang chờ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
