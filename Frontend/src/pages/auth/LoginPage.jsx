import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { setCredentials } from '../../redux/slices/authSlice'
import { login } from '../../services/auth.service'
import AuthLayout from '../../components/layout/AuthLayout'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email là bắt buộc'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ'
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc'
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setApiError('')
    try {
      const res = await login({ email: form.email, password: form.password })
      const { accessToken, refreshToken, user } = res.data.data
      dispatch(setCredentials({ user, token: accessToken, refreshToken }))
      const pending = sessionStorage.getItem('pendingInviteToken')
      if (pending) {
        sessionStorage.removeItem('pendingInviteToken')
        navigate(`/accept-invite?token=${pending}`)
      } else {
        navigate('/home')
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập vào TaskFlow</h1>
      <p className="text-gray-500 text-sm mb-6">Quản lý công việc của bạn hiệu quả hơn</p>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Nhập mật khẩu"
              className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang đăng nhập...
            </>
          ) : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-blue-600 font-medium hover:text-blue-800">
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  )
}
