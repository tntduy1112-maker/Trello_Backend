import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Globe, Users, Check } from 'lucide-react'
import { createBoard } from '../../services/board.service'
import Modal from '../../components/ui/Modal'
import { BOARD_BACKGROUNDS } from '../../data/constants'

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Riêng tư', icon: <Lock size={14} />, desc: 'Chỉ thành viên board mới thấy' },
  { value: 'workspace', label: 'Workspace', icon: <Users size={14} />, desc: 'Tất cả thành viên workspace thấy' },
  { value: 'public', label: 'Công khai', icon: <Globe size={14} />, desc: 'Bất kỳ ai cũng thấy' },
]

export default function CreateBoardModal({ isOpen, onClose, workspaceId, onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', visibility: 'workspace', cover_color: '#0052CC' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Tên board là bắt buộc'); return }
    setLoading(true)
    setError('')
    try {
      const res = await createBoard(workspaceId, {
        name: form.name.trim(),
        visibility: form.visibility,
        coverColor: form.cover_color,
      })
      const newBoard = res.data.data.board
      if (onCreated) onCreated(newBoard)
      onClose()
      navigate(`/board/${newBoard.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo board thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo board mới" size="md">
      <div className="p-4">
        {/* Preview */}
        <div
          className="w-full h-28 rounded-xl mb-5 flex items-end p-3 transition-colors"
          style={{ backgroundColor: form.cover_color }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">
            <p className="text-white font-semibold text-sm">{form.name || 'Tên board'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#B6C2CF] mb-1">
              Tên board <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError('') }}
              placeholder="VD: Sprint Q1 2025"
              autoFocus
              className={`w-full px-3 py-2.5 bg-[#1D2125] border rounded-lg text-[#B6C2CF] placeholder-[#596773] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${error ? 'border-red-500' : 'border-[#454F59]'}`}
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          {/* Background colors */}
          <div>
            <label className="block text-sm font-medium text-[#B6C2CF] mb-2">Màu nền</label>
            <div className="grid grid-cols-6 gap-2">
              {BOARD_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cover_color: bg.value }))}
                  className="aspect-video rounded-lg flex items-center justify-center border-2 transition-transform hover:scale-105"
                  style={{
                    backgroundColor: bg.value,
                    borderColor: form.cover_color === bg.value ? '#ffffff' : 'transparent',
                  }}
                >
                  {form.cover_color === bg.value && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-[#B6C2CF] mb-2">Quyền truy cập</label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, visibility: opt.value }))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    form.visibility === opt.value
                      ? 'border-[#0C66E4] bg-[#0C66E4]/10'
                      : 'border-[#454F59] hover:border-[#596773]'
                  }`}
                >
                  <span className={form.visibility === opt.value ? 'text-[#0C66E4]' : 'text-[#8C9BAB]'}>
                    {opt.icon}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${form.visibility === opt.value ? 'text-white' : 'text-[#B6C2CF]'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-[#596773]">{opt.desc}</p>
                  </div>
                  {form.visibility === opt.value && (
                    <Check size={14} className="ml-auto text-[#0C66E4]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg font-medium text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Tạo board'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
