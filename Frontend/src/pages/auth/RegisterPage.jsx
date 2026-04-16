import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { register } from '../../services/auth.service'
import AuthLayout from '../../components/layout/AuthLayout'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ full_name: '', email: searchParams.get('email') || '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Họ tên là bắt buộc'
    if (!form.email) errs.email = 'Email là bắt buộc'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ'
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc'
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    if (!form.confirm_password) errs.confirm_password = 'Vui lòng xác nhận mật khẩu'
    else if (form.password !== form.confirm_password) errs.confirm_password = 'Mật khẩu xác nhận không khớp'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setApiError('')
    try {
      await register({ email: form.email, password: form.password, fullName: form.full_name })
      navigate('/verify-email', { state: { email: form.email } })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản</h1>
      <p className="text-gray-600 text-sm mb-6">Bắt đầu quản lý công việc ngay hôm nay</p>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Họ và tên</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={form.full_name}
              onChange={handleChange('full_name')}
              placeholder="Nguyễn Văn An"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.full_name ? 'border-red-400' : 'border-gray-300'}`}
            />
          </div>
          {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Mật khẩu</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Ít nhất 6 ký tự"
              className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              value={form.confirm_password}
              onChange={handleChange('confirm_password')}
              placeholder="Nhập lại mật khẩu"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirm_password ? 'border-red-400' : 'border-gray-300'}`}
            />
          </div>
          {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang đăng ký...</>
          ) : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800">Đăng nhập</Link>
      </p>
    </AuthLayout>
  )
}
