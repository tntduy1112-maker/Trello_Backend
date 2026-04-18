import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Users, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { previewInvitation, acceptInvitation } from '../../services/invitation.service'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('loading') // loading | preview | accepting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Link không hợp lệ — thiếu token.')
      return
    }

    previewInvitation(token)
      .then((res) => {
        const inv = res.data.data.invitation
        setPreview(inv)

        if (isAuthenticated) {
          // Auto-accept if already logged in
          setStatus('accepting')
          acceptInvitation(token)
            .then((r) => {
              setStatus('success')
              const boardId = r.data.data.boardId
              setTimeout(() => navigate(`/board/${boardId}`), 1500)
            })
            .catch((err) => {
              setStatus('error')
              setErrorMsg(err.response?.data?.message || 'Không thể chấp nhận lời mời.')
            })
        } else {
          // Save token to sessionStorage so LoginPage can redirect here after auth
          sessionStorage.setItem('pendingInviteToken', token)
          setStatus('preview')
        }
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.message || 'Lời mời không hợp lệ hoặc đã hết hạn.')
      })
  }, [token, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const roleLabelMap = { owner: 'Quản lý', admin: 'Quản trị viên', member: 'Thành viên', viewer: 'Chỉ xem' }

  return (
    <div className="min-h-screen bg-[#1D2125] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#282E33] rounded-2xl shadow-2xl border border-[#454F59]/30 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0052CC] px-6 py-5">
          <h1 className="text-xl font-bold text-white">TaskFlow</h1>
          <p className="text-blue-200 text-sm mt-1">Lời mời tham gia board</p>
        </div>

        <div className="p-6">
          {/* Loading */}
          {(status === 'loading' || status === 'accepting') && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-10 h-10 border-4 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#8C9BAB] text-sm">
                {status === 'accepting' ? 'Đang tham gia board...' : 'Đang tải thông tin...'}
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && preview && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-900/40 flex items-center justify-center">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Đã tham gia thành công!</p>
                <p className="text-[#8C9BAB] text-sm mt-1">
                  Bạn đã vào board <strong className="text-[#B6C2CF]">{preview.boardName}</strong>
                </p>
              </div>
              <p className="text-xs text-[#596773]">Đang chuyển hướng...</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Lời mời không hợp lệ</p>
                <p className="text-[#8C9BAB] text-sm mt-1">{errorMsg}</p>
              </div>
              <Link
                to="/home"
                className="mt-2 px-4 py-2 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-lg text-sm transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          )}

          {/* Preview — not logged in */}
          {status === 'preview' && preview && (
            <div className="space-y-5">
              {/* Board info */}
              <div className="flex items-center gap-3 p-4 bg-[#22272B] rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#0052CC] flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{preview.boardName}</p>
                  <p className="text-xs text-[#8C9BAB]">
                    Được mời bởi <span className="text-[#B6C2CF]">{preview.inviterName}</span>
                    {' · '}
                    Vai trò: <span className="text-[#B6C2CF]">{roleLabelMap[preview.role] || preview.role}</span>
                  </p>
                </div>
              </div>

              <p className="text-[#8C9BAB] text-sm text-center">
                Đăng nhập hoặc tạo tài khoản để tham gia board này
              </p>

              {/* Action buttons */}
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-full text-sm font-medium transition-colors"
                >
                  <LogIn size={15} />
                  Đăng nhập để tham gia
                </Link>
                <Link
                  to={`/register?email=${encodeURIComponent(preview.email)}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] rounded-full text-sm font-medium transition-colors"
                >
                  <UserPlus size={15} />
                  Tạo tài khoản mới
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
