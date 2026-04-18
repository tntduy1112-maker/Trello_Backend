import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { forgotPassword } from '../../services/auth.service'
import AuthLayout from '../../components/layout/AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email là bắt buộc'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email không hợp lệ'); return }
    setLoading(true)
    setError('')
    try {
      await forgotPassword({ email })
      setSent(true)
    } catch (err) {
      // Backend returns success silently for security; show generic error only on network failures
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="inline-flex w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Mail size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email đã được gửi!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Nếu <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.
            Vui lòng kiểm tra hộp thư (kể cả thư rác).
          </p>
          <Link
            to="/login"
            className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm text-center transition-colors"
          >
            Quay về đăng nhập
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} />
        Quay về đăng nhập
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
      <p className="text-gray-500 text-sm mb-6">
        Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
            />
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : 'Gửi email đặt lại mật khẩu'}
        </button>
      </form>
    </AuthLayout>
  )
}
