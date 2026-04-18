import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ArrowLeft, Building2 } from 'lucide-react'
import { createWorkspaceThunk } from '../../redux/slices/workspaceSlice'
import AppLayout from '../../components/layout/AppLayout'
import { generateAvatarColor, getInitials, slugify } from '../../utils/helpers'

export default function CreateWorkspacePage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form, setForm] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Tên workspace là bắt buộc'
    else if (form.name.trim().length < 1) errs.name = 'Tên phải có ít nhất 1 ký tự'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      const resultAction = await dispatch(createWorkspaceThunk({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }))
      if (createWorkspaceThunk.fulfilled.match(resultAction)) {
        navigate(`/workspaces/${resultAction.payload.slug}`)
      } else {
        setErrors({ name: resultAction.payload || 'Tạo workspace thất bại' })
      }
    } finally {
      setLoading(false)
    }
  }

  const slug = slugify(form.name)

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-sm text-[#8C9BAB] hover:text-[#B6C2CF] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <div className="bg-[#22272B] border border-[#2C333A] rounded-xl p-6">
          <h1 className="text-xl font-bold text-white mb-6">Tạo workspace mới</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: form.name ? generateAvatarColor(form.name) : '#2C333A' }}
              >
                <span className="text-xl font-bold text-white">
                  {form.name ? getInitials(form.name) : <Building2 size={24} className="text-[#596773]" />}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#B6C2CF]">Logo được tạo tự động từ tên workspace</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#B6C2CF] mb-1">
                Tên workspace <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: '' })) }}
                placeholder="VD: Công ty ABC"
                className={`w-full px-3 py-2.5 bg-[#1D2125] border rounded-lg text-[#B6C2CF] placeholder-[#596773] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${errors.name ? 'border-red-500' : 'border-[#454F59]'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              {form.name && (
                <p className="mt-1 text-xs text-[#596773]">Slug: {slug}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#B6C2CF] mb-1">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn về workspace của bạn..."
                rows={3}
                className="w-full px-3 py-2.5 bg-[#1D2125] border border-[#454F59] rounded-lg text-[#B6C2CF] placeholder-[#596773] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-2.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-full font-medium text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-[#0C66E4] hover:bg-[#0055CC] disabled:bg-[#0C66E4]/50 text-white rounded-full font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Tạo workspace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
