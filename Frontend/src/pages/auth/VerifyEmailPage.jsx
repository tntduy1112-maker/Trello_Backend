import React, { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, ArrowRight } from 'lucide-react'
import { verifyEmail, resendVerification } from '../../services/auth.service'
import AuthLayout from '../../components/layout/AuthLayout'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const inputRefs = useRef([])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 số'); return }
    if (!email) { setError('Không tìm thấy email. Vui lòng đăng ký lại.'); return }
    setLoading(true)
    setError('')
    try {
      await verifyEmail({ email, otp: code })
      navigate('/login', { state: { verified: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) { setError('Không tìm thấy email.'); return }
    setResending(true)
    setResendMsg('')
    setError('')
    try {
      await resendVerification({ email })
      setResendMsg('Đã gửi lại mã OTP!')
      setTimeout(() => setResendMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
          <Mail size={28} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác minh email</h1>
        <p className="text-gray-500 text-sm">
          Chúng tôi đã gửi mã 6 chữ số đến{' '}
          {email && <strong>{email}</strong>}
          {!email && 'email của bạn'}
          . Vui lòng kiểm tra hộp thư.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-900"
            />
          ))}
        </div>

        {error && <p className="text-center text-sm text-red-500 mb-4">{error}</p>}
        {resendMsg && <p className="text-center text-sm text-green-600 mb-4">{resendMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Xác minh <ArrowRight size={16} /></>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Không nhận được mã?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-blue-600 font-medium hover:text-blue-800 disabled:opacity-50"
          >
            {resending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
