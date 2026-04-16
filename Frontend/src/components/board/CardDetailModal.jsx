import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  X, AlignLeft, CheckSquare, MessageSquare,
  Archive, Trash2, Plus, Check,
  Edit3, UserX, Tag, Pencil, Activity,
  Paperclip, FileText, Image, Download, CheckCircle, AlertCircle,
} from 'lucide-react'
import {
  updateCard, saveCardThunk, deleteCardThunk,
  addCardLabelThunk, removeCardLabelThunk,
  createLabelThunk, updateLabelThunk, deleteLabelThunk,
  fetchCardActivity, fetchCardComments,
  addCommentThunk, editCommentThunk, deleteCommentThunk,
  fetchCardAttachments, addAttachmentThunk,
  deleteAttachmentThunk, toggleAttachmentCoverThunk,
} from '../../redux/slices/boardSlice'
import { formatDate, formatRelativeTime, isOverdue } from '../../utils/helpers'
import { PRIORITY_COLOR } from '../../data/constants'
import Avatar from '../ui/Avatar'
import ProgressBar from '../ui/ProgressBar'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', color: 'text-blue-400' },
  { value: 'medium', label: 'Trung bình', color: 'text-yellow-400' },
  { value: 'high', label: 'Cao', color: 'text-orange-400' },
  { value: 'critical', label: 'Khẩn cấp', color: 'text-red-400' },
]

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46',
  '#C377E0', '#0079BF', '#00C2E0', '#51E898',
  '#FF78CB', '#344563',
]

const ACTION_LABEL = {
  'card.created': (m) => `đã tạo card "${m?.title || ''}"`,
  'card.deleted': (m) => `đã xóa card "${m?.title || ''}"`,
  'card.updated': (m) => {
    const changes = m?.changes || []
    if (changes.length === 0) return 'đã cập nhật card'
    const FIELD_VI = { title: 'tiêu đề', description: 'mô tả', priority: 'độ ưu tiên', dueDate: 'hạn', archived: 'lưu trữ', completed: 'hoàn thành', coverColor: 'màu bìa', assignee: 'thành viên' }
    if (changes.length === 1) return `đã cập nhật ${FIELD_VI[changes[0].field] || changes[0].field}`
    return `đã cập nhật ${changes.length} trường`
  },
  'list.created': (m) => `đã tạo danh sách "${m?.name || ''}"`,
  'list.deleted': (m) => `đã xóa danh sách "${m?.name || ''}"`,
}

const getActionLabel = (log) => {
  const fn = ACTION_LABEL[log.action]
  return fn ? fn(log.metadata) : log.action
}

export default function CardDetailModal({ card, listId, isOpen, onClose, boardMembers = [] }) {
  const dispatch = useDispatch()
  const { user: currentUser } = useSelector((state) => state.auth)
  const boardLabels = useSelector((state) => state.board.boardLabels)
  const currentBoard = useSelector((state) => state.board.currentBoard)
  const cardActivity = useSelector((state) => state.board.cardActivity)
  const loadingActivity = useSelector((state) => state.board.loadingActivity)
  const cardComments = useSelector((state) => state.board.cardComments)
  const loadingComments = useSelector((state) => state.board.loadingComments)
  const cardAttachments = useSelector((state) => state.board.cardAttachments)
  const loadingAttachments = useSelector((state) => state.board.loadingAttachments)

  // Derive up-to-date labels from the Redux store so they reflect toggle changes instantly
  const cardInStore = useSelector((state) => {
    const cardList = state.board.cards[listId] || []
    return cardList.find((c) => c.id === card?.id)
  })
  const cardLabels = (cardInStore || card)?.labels || []

  const [activeTab, setActiveTab] = useState('comments')

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(card?.title || '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [description, setDescription] = useState(card?.description || '')
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)   // commentId | null
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [editingComment, setEditingComment] = useState(null) // { id, content, parentId }
  const [savingEdit, setSavingEdit] = useState(false)
  const [priority, setPriority] = useState(card?.priority || 'medium')
  const [dueDate, setDueDate] = useState(card?.due_date || '')
  const [isCompleted, setIsCompleted] = useState(card?.is_completed || false)
  const [completing, setCompleting] = useState(false)

  // Single assignee
  const [assignee, setAssignee] = useState(card?.assignees?.[0] || null)
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const memberPickerRef = useRef(null)

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [descError, setDescError] = useState('')

  // Label picker state
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#0079BF')
  const [creatingLabel, setCreatingLabel] = useState(false)
  const [editingLabel, setEditingLabel] = useState(null) // { id, name, color }
  const [togglingLabelId, setTogglingLabelId] = useState(null)
  const [labelError, setLabelError] = useState('')
  const labelPickerRef = useRef(null)

  // Attachments
  const fileInputRef = useRef(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [toast, setToast] = useState(null) // { message, type: 'success'|'error' }

  // Fetch comments, activity, attachments when modal opens
  useEffect(() => {
    if (isOpen && card?.id) {
      dispatch(fetchCardComments(card.id))
      dispatch(fetchCardActivity(card.id))
      dispatch(fetchCardAttachments(card.id))
    }
  }, [isOpen, card?.id, dispatch])

  // Close pickers when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (memberPickerRef.current && !memberPickerRef.current.contains(e.target)) {
        setShowMemberPicker(false)
      }
      if (labelPickerRef.current && !labelPickerRef.current.contains(e.target)) {
        setShowLabelPicker(false)
        setEditingLabel(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-clear toast after 3.5 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

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

  const handleAddComment = async () => {
    if (!comment.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      await dispatch(addCommentThunk({ cardId: card.id, content: comment.trim() })).unwrap()
      setComment('')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleAddReply = async (parentId) => {
    if (!replyText.trim() || submittingReply) return
    setSubmittingReply(true)
    try {
      await dispatch(addCommentThunk({ cardId: card.id, content: replyText.trim(), parentId })).unwrap()
      setReplyText('')
      setReplyingTo(null)
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingComment || !editingComment.content.trim() || savingEdit) return
    setSavingEdit(true)
    try {
      await dispatch(editCommentThunk({
        commentId: editingComment.id,
        content: editingComment.content.trim(),
        parentId: editingComment.parentId,
      })).unwrap()
      setEditingComment(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteComment = (commentId, parentId = null) => {
    dispatch(deleteCommentThunk({ commentId, parentId }))
  }

  const handleChangePriority = (p) => {
    setPriority(p)
    dispatch(updateCard({ listId, cardId: card.id, updates: { priority: p } }))
  }

  const handleChangeDueDate = (d) => {
    setDueDate(d)
    dispatch(updateCard({ listId, cardId: card.id, updates: { due_date: d } }))
  }

  const handleToggleComplete = async () => {
    const newValue = !isCompleted
    setIsCompleted(newValue)
    setCompleting(true)
    try {
      await dispatch(saveCardThunk({
        cardId: card.id,
        listId,
        data: { isCompleted: newValue },
      })).unwrap()
    } catch {
      setIsCompleted(!newValue)
    } finally {
      setCompleting(false)
    }
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
          isCompleted,
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

  // ── Label handlers ────────────────────────────────────────────────────────

  const handleToggleLabel = async (label) => {
    if (togglingLabelId) return
    setTogglingLabelId(label.id)
    setLabelError('')
    const isOn = cardLabels.some((l) => l.id === label.id)
    try {
      if (isOn) {
        await dispatch(removeCardLabelThunk({ cardId: card.id, labelId: label.id, listId })).unwrap()
      } else {
        await dispatch(addCardLabelThunk({ cardId: card.id, labelId: label.id, listId })).unwrap()
      }
    } catch (err) {
      setLabelError(typeof err === 'string' ? err : 'Lỗi khi gán nhãn, thử lại.')
    } finally {
      setTogglingLabelId(null)
    }
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || creatingLabel || !currentBoard) return
    setCreatingLabel(true)
    setLabelError('')
    try {
      const newLabel = await dispatch(createLabelThunk({
        boardId: currentBoard.id,
        name: newLabelName.trim(),
        color: newLabelColor,
      })).unwrap()
      setNewLabelName('')
      // Auto-assign the newly created label to this card immediately
      await dispatch(addCardLabelThunk({ cardId: card.id, labelId: newLabel.id, listId })).unwrap()
    } catch (err) {
      setLabelError(typeof err === 'string' ? err : 'Lỗi khi tạo nhãn.')
    } finally {
      setCreatingLabel(false)
    }
  }

  const handleSaveEditLabel = async () => {
    if (!editingLabel) return
    await dispatch(updateLabelThunk({
      labelId: editingLabel.id,
      name: editingLabel.name,
      color: editingLabel.color,
    })).unwrap()
    setEditingLabel(null)
  }

  const handleDeleteLabel = async (labelId, e) => {
    e.stopPropagation()
    await dispatch(deleteLabelThunk(labelId))
  }

  // ── Attachment handlers ────────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadError('')
    setUploadingFile(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        await dispatch(addAttachmentThunk({ cardId: card.id, listId, formData })).unwrap()
      }
    } catch (err) {
      setUploadError(typeof err === 'string' ? err : 'Tải lên thất bại, thử lại.')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await dispatch(deleteAttachmentThunk({ cardId: card.id, listId, attachmentId })).unwrap()
    } catch {
      // silently ignore
    }
  }

  const handleToggleCover = async (attachmentId) => {
    try {
      await dispatch(toggleAttachmentCoverThunk({ cardId: card.id, listId, attachmentId })).unwrap()
    } catch {
      // silently ignore
    }
  }

  const handleDownload = async (att) => {
    if (downloadingId) return
    setDownloadingId(att.id)
    setToast(null)
    try {
      // Fetch file as Blob (verifies network & integrity before writing to disk)
      const response = await fetch(att.file_url)
      if (!response.ok) throw new Error('Network error')
      const blob = await response.blob()

      // Try File System Access API (Chrome/Edge 86+) → opens OS Save-As dialog
      if (typeof window.showSaveFilePicker === 'function') {
        const ext = att.file_name.includes('.') ? `.${att.file_name.split('.').pop()}` : ''
        const mimeType = att.file_type || 'application/octet-stream'
        const handle = await window.showSaveFilePicker({
          suggestedName: att.file_name,
          types: [{ description: 'File', accept: { [mimeType]: ext ? [ext] : [] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        // Fallback: programmatic anchor — respects browser "Ask where to save" setting
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = att.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      setToast({ message: `Đã tải về: ${att.file_name}`, type: 'success' })
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled the Save-As dialog — silent, no toast
      } else {
        setToast({ message: 'Tải về thất bại. Kiểm tra kết nối mạng.', type: 'error' })
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ─────────────────────────────────────────────────────────────────────────

  const overdue = isOverdue(dueDate)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl bg-[#282E33] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        {(card.cover_image_url || card.cover_color) && (
          <div
            className="h-28 rounded-t-2xl flex items-end p-4 bg-cover bg-center"
            style={card.cover_image_url
              ? { backgroundImage: `url(${card.cover_image_url})` }
              : { backgroundColor: card.cover_color }
            }
          >
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
            {/* Labels (display row at top) */}
            {cardLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cardLabels.map((label) => (
                  <span
                    key={label.id}
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
                  className={`text-xl font-bold cursor-text hover:bg-[#2C333A] rounded-xl px-3 py-2 -ml-3 transition-colors ${
                    isCompleted ? 'line-through text-[#596773]' : 'text-white'
                  }`}
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

            {/* Attachments */}
            {(loadingAttachments || cardAttachments.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip size={16} className="text-[#8C9BAB]" />
                  <h3 className="text-sm font-semibold text-[#B6C2CF]">Đính kèm</h3>
                </div>
                {loadingAttachments ? (
                  <div className="flex justify-center py-3">
                    <div className="w-4 h-4 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cardAttachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-3 p-2 bg-[#22272B] rounded-xl group">
                        {/* Thumbnail or icon */}
                        {att.file_type?.startsWith('image/') ? (
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 bg-[#2C333A] rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText size={18} className="text-[#596773]" />
                          </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#B6C2CF] hover:text-white truncate block transition-colors"
                          >
                            {att.file_name}
                          </a>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#596773]">{formatFileSize(att.file_size)}</span>
                            <span className="text-[10px] text-[#596773]">{formatRelativeTime(att.created_at)}</span>
                            {att.is_cover && (
                              <span className="text-[10px] text-blue-400 font-medium">Ảnh bìa</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <button
                              onClick={() => handleDownload(att)}
                              disabled={!!downloadingId}
                              className="flex items-center gap-1 text-[10px] text-[#596773] hover:text-[#B6C2CF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {downloadingId === att.id ? (
                                <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download size={11} />
                              )}
                              {downloadingId === att.id ? 'Đang tải...' : 'Tải về'}
                            </button>
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="text-[10px] text-[#596773] hover:text-red-400 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments / Activity tabs */}
            <div>
              {/* Tab switcher */}
              <div className="flex items-center gap-1 mb-3">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'comments' ? 'bg-[#2C333A] text-white' : 'text-[#8C9BAB] hover:text-[#B6C2CF]'
                  }`}
                >
                  <MessageSquare size={13} />
                  Bình luận
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'activity' ? 'bg-[#2C333A] text-white' : 'text-[#8C9BAB] hover:text-[#B6C2CF]'
                  }`}
                >
                  <Activity size={13} />
                  Hoạt động
                </button>
              </div>

              {/* Comments panel */}
              {activeTab === 'comments' && (
                <>
                  {/* New comment input */}
                  <div className="flex gap-3 mb-4">
                    <Avatar src={currentUser?.avatar_url} name={currentUser?.full_name || 'Bạn'} size="sm" className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Viết bình luận..."
                        rows={2}
                        className="w-full px-3 py-2 bg-[#22272B] border border-[#454F59] rounded-xl text-[#B6C2CF] placeholder-[#596773] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment() }}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!comment.trim() || submittingComment}
                        className="mt-2 px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        {submittingComment && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Gửi
                      </button>
                    </div>
                  </div>

                  {/* Comments list */}
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cardComments.map((c) => (
                        <div key={c.id}>
                          {/* Top-level comment */}
                          <div className="flex gap-3">
                            <Avatar src={c.user?.avatar_url} name={c.user?.full_name || '?'} size="sm" className="flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{c.user?.full_name}</span>
                                <span className="text-xs text-[#596773]">{formatRelativeTime(c.created_at)}</span>
                                {c.is_edited && <span className="text-xs text-[#596773] italic">(đã sửa)</span>}
                              </div>

                              {editingComment?.id === c.id ? (
                                <div>
                                  <textarea
                                    value={editingComment.content}
                                    onChange={(e) => setEditingComment((prev) => ({ ...prev, content: e.target.value }))}
                                    rows={2}
                                    autoFocus
                                    className="w-full px-3 py-2 bg-[#22272B] border border-[#0C66E4] rounded-xl text-[#B6C2CF] text-sm resize-none focus:outline-none"
                                  />
                                  <div className="flex gap-2 mt-1.5">
                                    <button onClick={handleSaveEdit} disabled={savingEdit} className="px-3 py-1 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                                      {savingEdit && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                      Lưu
                                    </button>
                                    <button onClick={() => setEditingComment(null)} className="px-3 py-1 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs">Hủy</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-[#22272B] rounded-xl px-3 py-2">
                                  <p className="text-sm text-[#B6C2CF] whitespace-pre-wrap">{c.content}</p>
                                </div>
                              )}

                              {/* Comment actions */}
                              <div className="flex items-center gap-3 mt-1.5">
                                <button
                                  onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText('') }}
                                  className="text-xs text-[#596773] hover:text-[#B6C2CF] transition-colors"
                                >
                                  Trả lời
                                </button>
                                {c.user_id === currentUser?.id && (
                                  <>
                                    <button
                                      onClick={() => setEditingComment({ id: c.id, content: c.content, parentId: null })}
                                      className="text-xs text-[#596773] hover:text-[#B6C2CF] transition-colors"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(c.id, null)}
                                      className="text-xs text-[#596773] hover:text-red-400 transition-colors"
                                    >
                                      Xóa
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {(c.replies?.length > 0 || replyingTo === c.id) && (
                            <div className="ml-9 mt-2 space-y-3 border-l-2 border-[#2C333A] pl-3">
                              {(c.replies || []).map((r) => (
                                <div key={r.id} className="flex gap-2">
                                  <Avatar src={r.user?.avatar_url} name={r.user?.full_name || '?'} size="sm" className="flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-1">
                                      <span className="text-sm font-medium text-white">{r.user?.full_name}</span>
                                      <span className="text-xs text-[#596773]">{formatRelativeTime(r.created_at)}</span>
                                      {r.is_edited && <span className="text-xs text-[#596773] italic">(đã sửa)</span>}
                                    </div>

                                    {editingComment?.id === r.id ? (
                                      <div>
                                        <textarea
                                          value={editingComment.content}
                                          onChange={(e) => setEditingComment((prev) => ({ ...prev, content: e.target.value }))}
                                          rows={2}
                                          autoFocus
                                          className="w-full px-3 py-2 bg-[#22272B] border border-[#0C66E4] rounded-xl text-[#B6C2CF] text-sm resize-none focus:outline-none"
                                        />
                                        <div className="flex gap-2 mt-1.5">
                                          <button onClick={handleSaveEdit} disabled={savingEdit} className="px-3 py-1 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                                            {savingEdit && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                            Lưu
                                          </button>
                                          <button onClick={() => setEditingComment(null)} className="px-3 py-1 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs">Hủy</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-[#22272B] rounded-xl px-3 py-2">
                                        <p className="text-sm text-[#B6C2CF] whitespace-pre-wrap">{r.content}</p>
                                      </div>
                                    )}

                                    {r.user_id === currentUser?.id && (
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <button
                                          onClick={() => setEditingComment({ id: r.id, content: r.content, parentId: c.id })}
                                          className="text-xs text-[#596773] hover:text-[#B6C2CF] transition-colors"
                                        >
                                          Sửa
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(r.id, c.id)}
                                          className="text-xs text-[#596773] hover:text-red-400 transition-colors"
                                        >
                                          Xóa
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Reply input */}
                              {replyingTo === c.id && (
                                <div className="flex gap-2">
                                  <Avatar src={currentUser?.avatar_url} name={currentUser?.full_name || 'Bạn'} size="sm" className="flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder={`Trả lời ${c.user?.full_name}...`}
                                      rows={2}
                                      autoFocus
                                      className="w-full px-3 py-2 bg-[#22272B] border border-[#454F59] rounded-xl text-[#B6C2CF] placeholder-[#596773] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
                                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddReply(c.id) }}
                                    />
                                    <div className="flex gap-2 mt-1.5">
                                      <button
                                        onClick={() => handleAddReply(c.id)}
                                        disabled={!replyText.trim() || submittingReply}
                                        className="px-3 py-1 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                                      >
                                        {submittingReply && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        Gửi
                                      </button>
                                      <button onClick={() => { setReplyingTo(null); setReplyText('') }} className="px-3 py-1 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs">Hủy</button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Activity panel */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {loadingActivity ? (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : cardActivity.length === 0 ? (
                    <p className="text-xs text-[#596773] text-center py-6">Chưa có hoạt động nào.</p>
                  ) : cardActivity.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <Avatar
                        src={log.user?.avatar_url}
                        name={log.user?.full_name || '?'}
                        size="sm"
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-white">
                            {log.user?.full_name || 'Người dùng'}
                          </span>
                          <span className="text-xs text-[#596773]">{formatRelativeTime(log.created_at)}</span>
                        </div>
                        <p className="text-xs text-[#8C9BAB] mt-0.5">{getActionLabel(log)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (right 1/3) */}
          <div className="w-44 flex-shrink-0 space-y-4">
            {/* Members — single assignee picker */}
            <div ref={memberPickerRef} className="relative">
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Thành viên</p>

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

            {/* ── Labels ───────────────────────────────────────────── */}
            <div ref={labelPickerRef} className="relative">
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Nhãn</p>

              {/* Current card labels */}
              <div className="flex flex-wrap gap-1 mb-2">
                {cardLabels.length === 0 ? (
                  <p className="text-xs text-[#596773]">Chưa có nhãn</p>
                ) : cardLabels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>

              <button
                onClick={() => { setShowLabelPicker((v) => !v); setEditingLabel(null) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-xs transition-colors"
              >
                <Tag size={13} /> Chỉnh sửa nhãn
              </button>

              {/* Label picker dropdown */}
              {showLabelPicker && (
                <div className="absolute right-0 mt-1 w-64 bg-[#282E33] border border-[#454F59] rounded-xl shadow-2xl z-20">
                  {/* Header */}
                  <div className="px-3 py-2 border-b border-[#454F59] flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#8C9BAB]">Nhãn</p>
                    <button
                      onClick={() => setShowLabelPicker(false)}
                      className="text-[#596773] hover:text-[#B6C2CF] transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Board labels list */}
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {boardLabels.length === 0 ? (
                      <p className="text-xs text-[#596773] text-center py-3 px-3">
                        Chưa có nhãn. Tạo nhãn đầu tiên bên dưới.
                      </p>
                    ) : boardLabels.map((label) => {
                      const isOn = cardLabels.some((l) => l.id === label.id)
                      const isEditing = editingLabel?.id === label.id

                      return (
                        <div key={label.id}>
                          {isEditing ? (
                            /* Inline edit row */
                            <div className="px-3 py-2 bg-[#2C333A] space-y-2">
                              <input
                                value={editingLabel.name}
                                onChange={(e) => setEditingLabel((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full px-2 py-1 bg-[#22272B] border border-[#454F59] rounded-lg text-xs text-[#B6C2CF] focus:outline-none focus:ring-1 focus:ring-[#0C66E4]"
                                placeholder="Tên nhãn"
                                autoFocus
                              />
                              <div className="flex flex-wrap gap-1">
                                {LABEL_COLORS.map((hex) => (
                                  <button
                                    key={hex}
                                    onClick={() => setEditingLabel((prev) => ({ ...prev, color: hex }))}
                                    className={`w-6 h-4 rounded transition-all ${editingLabel.color === hex ? 'ring-2 ring-white ring-offset-1 ring-offset-[#2C333A]' : ''}`}
                                    style={{ backgroundColor: hex }}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={handleSaveEditLabel}
                                  className="flex-1 py-1 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded text-xs font-medium"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setEditingLabel(null)}
                                  className="flex-1 py-1 bg-[#454F59] hover:bg-[#596773] text-[#B6C2CF] rounded text-xs"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal label row */
                            <button
                              type="button"
                              disabled={!!togglingLabelId}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2C333A] cursor-pointer group text-left disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              onClick={() => handleToggleLabel(label)}
                            >
                              {/* Checkbox / spinner */}
                              {togglingLabelId === label.id ? (
                                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                  <div className="w-3 h-3 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isOn ? 'bg-[#0C66E4] border-[#0C66E4]' : 'border-[#596773]'
                                }`}>
                                  {isOn && <Check size={10} className="text-white" />}
                                </div>
                              )}
                              {/* Color swatch + name */}
                              <div
                                className="h-5 rounded flex-shrink-0"
                                style={{ width: 32, backgroundColor: label.color }}
                              />
                              <span className="flex-1 text-xs text-[#B6C2CF] truncate">{label.name || '(no name)'}</span>
                              {/* Edit button */}
                              <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingLabel({ id: label.id, name: label.name || '', color: label.color })
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[#596773] hover:text-[#B6C2CF] transition-all flex-shrink-0 p-0.5"
                              >
                                <Pencil size={11} />
                              </span>
                              {/* Delete button */}
                              <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => handleDeleteLabel(label.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-[#596773] hover:text-red-400 transition-all flex-shrink-0 p-0.5"
                              >
                                <X size={11} />
                              </span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Create new label */}
                  <div className="border-t border-[#454F59] p-3 space-y-2">
                    <p className="text-xs font-semibold text-[#8C9BAB]">Tạo nhãn mới</p>
                    {labelError && (
                      <p className="text-xs text-red-400 px-1">{labelError}</p>
                    )}
                    <input
                      value={newLabelName}
                      onChange={(e) => { setNewLabelName(e.target.value); setLabelError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateLabel() }}
                      placeholder="Tên nhãn..."
                      className="w-full px-2 py-1.5 bg-[#22272B] border border-[#454F59] rounded-lg text-xs text-[#B6C2CF] placeholder-[#596773] focus:outline-none focus:ring-1 focus:ring-[#0C66E4]"
                    />
                    {/* Color palette */}
                    <div className="flex flex-wrap gap-1.5">
                      {LABEL_COLORS.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => setNewLabelColor(hex)}
                          className={`w-7 h-5 rounded transition-all ${newLabelColor === hex ? 'ring-2 ring-white ring-offset-1 ring-offset-[#282E33]' : ''}`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim() || creatingLabel}
                      className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      {creatingLabel && (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {creatingLabel ? 'Đang tạo & gán...' : 'Tạo nhãn'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments upload */}
            <div>
              <p className="text-xs font-semibold text-[#8C9BAB] mb-2 uppercase tracking-wide">Đính kèm</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                className="hidden"
                onChange={handleFileUpload}
              />
              {uploadError && (
                <p className="text-[10px] text-red-400 mb-1">{uploadError}</p>
              )}
              <button
                onClick={() => { setUploadError(''); fileInputRef.current?.click() }}
                disabled={uploadingFile}
                className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#2C333A] hover:bg-[#38424B] disabled:opacity-50 text-[#B6C2CF] rounded-lg text-xs transition-colors"
              >
                {uploadingFile ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <Paperclip size={13} />
                )}
                {uploadingFile ? 'Đang tải lên...' : 'Thêm đính kèm'}
              </button>
              {cardAttachments.length > 0 && (
                <p className="text-[10px] text-[#596773] mt-1">{cardAttachments.length} file đính kèm</p>
              )}
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

            {/* Complete toggle */}
            <div>
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={completing}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border disabled:opacity-60 ${
                  isCompleted
                    ? 'bg-green-900/30 border-green-700/50 text-green-400 hover:bg-green-900/50'
                    : 'bg-[#2C333A] border-transparent text-[#B6C2CF] hover:bg-[#38424B]'
                }`}
              >
                {completing ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckSquare size={13} />
                )}
                {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </button>
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

      {/* Download toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-fade-in ${
            toast.type === 'success'
              ? 'bg-[#1D3A2A] border border-green-700/60 text-green-300'
              : 'bg-[#3A1D1D] border border-red-700/60 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={16} className="flex-shrink-0 text-green-400" />
          ) : (
            <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
          )}
          <span className="max-w-xs truncate">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
