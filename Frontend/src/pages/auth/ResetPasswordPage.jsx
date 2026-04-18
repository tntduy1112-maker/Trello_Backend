import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { resetPassword } from '../../services/auth.service'
import AuthLayout from '../../components/layout/AuthLayout'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc'
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    if (!form.confirm_password) errs.confirm_password = 'Vui lòng xác nhận mật khẩu'
    else if (form.password !== form.confirm_password) errs.confirm_password = 'Mật khẩu không khớp'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (!token) {
      setErrors({ general: 'Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.' })
      return
    }
    setLoading(true)
    try {
      await resetPassword({ token, password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu thành công!</h2>
          <p className="text-gray-500 text-sm">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h1>
      <p className="text-gray-500 text-sm mb-6">Nhập mật khẩu mới cho tài khoản của bạn</p>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      {!token && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          Không tìm thấy token. Vui lòng sử dụng link trong email đặt lại mật khẩu.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors((er) => ({ ...er, password: '' })) }}
              placeholder="Ít nhất 6 ký tự"
              className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) => { setForm((f) => ({ ...f, confirm_password: e.target.value })); setErrors((er) => ({ ...er, confirm_password: '' })) }}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirm_password ? 'border-red-400' : 'border-gray-300'}`}
            />
          </div>
          {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Đặt lại mật khẩu'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800">Quay về đăng nhập</Link>
      </p>
    </AuthLayout>
  )
}
