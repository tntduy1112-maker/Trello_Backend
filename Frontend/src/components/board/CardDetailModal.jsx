import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  X, AlignLeft, CheckSquare, MessageSquare,
  Archive, Trash2, Plus, Check,
  Edit3, UserX
} from 'lucide-react'
import { updateCard, saveCardThunk, deleteCardThunk } from '../../redux/slices/boardSlice'
import { formatDate, formatRelativeTime, isOverdue, getInitials, generateAvatarColor } from '../../utils/helpers'
import { PRIORITY_COLOR } from '../../data/constants'
import Avatar from '../ui/Avatar'
import ProgressBar from '../ui/ProgressBar'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', color: 'text-blue-400' },
  { value: 'medium', label: 'Trung bình', color: 'text-yellow-400' },
  { value: 'high', label: 'Cao', color: 'text-orange-400' },
  { value: 'critical', label: 'Khẩn cấp', color: 'text-red-400' },
]

export default function CardDetailModal({ card, listId, isOpen, onClose, boardMembers = [] }) {
  const dispatch = useDispatch()
  const { user: currentUser } = useSelector((state) => state.auth)

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(card?.title || '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [description, setDescription] = useState(card?.description || '')
  const [comment, setComment] = useState('')
  const [priority, setPriority] = useState(card?.priority || 'medium')
  const [dueDate, setDueDate] = useState(card?.due_date || '')
  const [comments, setComments] = useState(card?.comments || [])

  // Single assignee
  const [assignee, setAssignee] = useState(card?.assignees?.[0] || null)
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const memberPickerRef = useRef(null)

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [descError, setDescError] = useState('')

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (memberPickerRef.current && !memberPickerRef.current.contains(e.target)) {
        setShowMemberPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!isOpen || !card) return null

  const handleSaveTitle = () => {
    if (title.trim() && title !== card.title) {
      dispatch(updateCard({ listId, cardId: card.id, updates: { title: title.trim() } }))
    }
    setEditingTitle(false)
  }

  const handleSaveDesc = () => {
    dispatch(updateCard({ listId, cardId: card.id, updates: { description } }))
    setEditingDesc(false)
  }

  const handleSelectMember = (member) => {
    const isSame = assignee?.user_id === member.user_id
    const next = isSame ? null : member
    setAssignee(next)
    dispatch(updateCard({ listId, cardId: card.id, updates: { assignees: next ? [next] : [] } }))
    setShowMemberPicker(false)
  }

  const handleAddComment = () => {
    if (!comment.trim()) return
    const newComment = {
      id: `cm-${Date.now()}`,
      user: currentUser || { full_name: 'Bạn', avatar_url: null },
      content: comment.trim(),
      created_at: new Date(),
    }
    setComments((c) => [...c, newComment])
    setComment('')
  }

  const handleChangePriority = (p) => {
    setPriority(p)
    dispatch(updateCard({ listId, cardId: card.id, updates: { priority: p } }))
  }

  const handleChangeDueDate = (d) => {
    setDueDate(d)
    dispatch(updateCard({ listId, cardId: card.id, updates: { due_date: d } }))
  }

  const handleSaveCard = async () => {
    if (!description.trim()) {
      setDescError('Mô tả không được để trống')
      return
    }
    setSaving(true)
    setSaveError('')
    setDescError('')
    try {
      await dispatch(saveCardThunk({
        cardId: card.id,
        listId,
        data: {
          title: title.trim() || card.title,
          description: description.trim(),
          priority,
          dueDate: dueDate || null,
          assigneeId: assignee?.user_id || null,
        },
      })).unwrap()
      onClose()
    } catch (err) {
      setSaveError(err || 'Lưu thất bại. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteCardThunk({ cardId: card.id, listId })).unwrap()
      onClose()
    } catch {
      // silently ignore
    }
  }

  const overdue = isOverdue(dueDate)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl bg-[#282E33] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        {card.cover_color && (
          <div className="h-28 rounded-t-2xl flex items-end p-4" style={{ backgroundColor: card.cover_color }}>
            <button className="text-xs px-2 py-1 bg-black/30 hover:bg-black/50 text-white rounded transition-colors flex items-center gap-1">
              <Edit3 size={11} /> Sửa ảnh bìa
            </button>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-xl hover:bg-[#454F59] text-[#8C9BAB] hover:text-white transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4 p-5">
          {/* Main content (left 2/3) */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <div>
              {editingTitle ? (
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveTitle() }
                    if (e.key === 'Escape') { setTitle(card.title); setEditingTitle(false) }
                  }}
                  autoFocus
                  className="w-full text-xl font-bold bg-[#22272B] text-white border border-[#454F59] rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
                  rows={2}
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-bold text-white cursor-text hover:bg-[#2C333A] rounded-xl px-3 py-2 -ml-3 transition-colors"
                >
                  {title || card.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft size={16} className="text-[#8C9BAB]" />
                <h3 className="text-sm font-semibold text-[#B6C2CF]">Mô tả</h3>
                {descError && <span className="text-xs text-red-400">{descError}</span>}
              </div>
              {editingDesc ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setDescError('') }}
                    autoFocus
                    rows={5}
                    placeholder="Thêm mô tả chi tiết cho card này..."
                    className={`w-full px-3 py-2.5 bg-[#22272B] border rounded-xl text-[#B6C2CF] text-sm placeholder-[#596773] resize-none focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${
                      descError ? 'border-red-500' : 'border-[#454F59]'
                    }`}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveDesc}
                      className="px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => { setDescription(card.description || ''); setEditingDesc(false); setDescError('') }}
                      className="px-3 py-1.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className={`min-h-[60px] px-3 py-2.5 rounded-xl cursor-text hover:bg-[#2C333A] transition-colors text-sm border ${
                    descError ? 'border-red-500/50' : 'border-transparent'
                  } ${description ? 'text-[#B6C2CF]' : 'text-[#596773]'}`}
                >
                  {description || 'Nhấp để thêm mô tả...'}
                </div>
              )}
            </div>

            {/* Checklist */}
            {card.checklist_progress && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare size={16} className="text-[#8C9BAB]" />
                  <h3 className="text-sm font-semibold text-[#B6C2CF]">Checklist</h3>
                </div>
                <ProgressBar
                  completed={card.checklist_progress.completed}
                  total={card.checklist_progress.total}
                  className="mb-3"
                />
                <div className="space-y-2">
                  {Array.from({ length: card.checklist_progress.total }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={i < card.checklist_progress.completed}
                        className="w-4 h-4 rounded border-[#454F59] bg-[#22272B] accent-[#0C66E4]"
                      />
                      <span className={`text-sm ${i < card.checklist_progress.completed ? 'line-through text-[#596773]' : 'text-[#B6C2CF]'}`}>
                        Mục {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-[#8C9BAB]" />
                <h3 className="text-sm font-semibold text-[#B6C2CF]">Bình luận</h3>
              </div>

              {/* Add comment */}
              <div className="flex gap-3 mb-4">
                <Avatar src={currentUser?.avatar_url} name={currentUser?.full_name || 'Bạn'} size="sm" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    rows={2}
                    className="w-full px-3 py-2 bg-[#22272B] border border-[#454F59] rounded-xl text-[#B6C2CF] placeholder-[#596773] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment()
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                    className="mt-2 px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Gửi
                  </button>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar src={c.user.avatar_url} name={c.user.full_name} size="sm" className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{c.user.full_name}</span>
                        <span className="text-xs text-[#596773]">{formatRelativeTime(c.created_at)}</span>
                      </div>
                      <div className="bg-[#22272B] rounded-xl px-3 py-2">
                        <p className="text-sm text-[#B6C2CF]">{c.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar (right 1/3) */}
          <div className="w-44 flex-shrink-0 space-y-4">
            {/* Members — single assignee picker */}
            <div ref={memberPickerRef} className="relative">
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Thành viên</p>

              {/* Current assignee */}
              {assignee ? (
                <div className="flex items-center gap-2 mb-2 p-2 bg-[#2C333A] rounded-lg">
                  <Avatar src={assignee.avatar_url} name={assignee.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{assignee.full_name}</p>
                  </div>
                  <button
                    onClick={() => handleSelectMember(assignee)}
                    className="text-[#596773] hover:text-red-400 transition-colors flex-shrink-0"
                    title="Bỏ assign"
                  >
                    <UserX size={13} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#596773] mb-2">Chưa có thành viên</p>
              )}

              <button
                onClick={() => setShowMemberPicker((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs transition-colors"
              >
                <Plus size={13} />
                {assignee ? 'Đổi thành viên' : 'Thêm thành viên'}
              </button>

              {/* Dropdown picker */}
              {showMemberPicker && (
                <div className="absolute right-0 mt-1 w-56 bg-[#282E33] border border-[#454F59] rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[#454F59]">
                    <p className="text-xs font-semibold text-[#8C9BAB]">Chọn thành viên</p>
                  </div>
                  {boardMembers.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-[#596773] text-center">
                      Chưa có thành viên trong board
                    </div>
                  ) : (
                    <ul className="py-1 max-h-52 overflow-y-auto">
                      {boardMembers.map((member) => {
                        const isSelected = assignee?.user_id === member.user_id
                        return (
                          <li key={member.id}>
                            <button
                              onClick={() => handleSelectMember(member)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#2C333A] ${
                                isSelected ? 'bg-[#0C66E4]/10' : ''
                              }`}
                            >
                              <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{member.full_name}</p>
                                <p className="text-xs text-[#596773] truncate">{member.email}</p>
                              </div>
                              {isSelected && (
                                <Check size={13} className="text-[#0C66E4] flex-shrink-0" />
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Labels */}
            <div>
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Nhãn</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels?.map((label, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: label.color }}>
                    {label.name}
                  </span>
                ))}
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs transition-colors">
                <Plus size={13} /> Chỉnh sửa nhãn
              </button>
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Ngày hết hạn</p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleChangeDueDate(e.target.value)}
                className={`w-full px-2 py-1.5 bg-[#22272B] border rounded-lg text-xs text-[#B6C2CF] focus:outline-none focus:ring-1 focus:ring-[#0C66E4] ${
                  overdue ? 'border-red-500' : 'border-[#454F59]'
                }`}
              />
              {dueDate && (
                <p className={`text-xs mt-1 ${overdue ? 'text-red-400' : 'text-[#596773]'}`}>
                  {overdue ? 'Đã quá hạn' : formatDate(dueDate)}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Độ ưu tiên</p>
              <div className="space-y-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleChangePriority(opt.value)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      priority === opt.value ? 'bg-[#2C333A] text-white' : 'text-[#8C9BAB] hover:bg-[#2C333A]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_COLOR[opt.value]}`} />
                    {opt.label}
                    {priority === opt.value && <Check size={12} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#454F59] pt-4 space-y-2">
              {saveError && (
                <p className="text-xs text-red-400 px-1">{saveError}</p>
              )}
              <button
                onClick={handleSaveCard}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : <Archive size={13} />}
                Lưu trữ card
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-xs transition-colors"
              >
                <Trash2 size={13} /> Xóa card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
