import React, { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Camera, Save, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { logout, updateProfileThunk } from '../../redux/slices/authSlice'
import { logout as logoutService } from '../../services/auth.service'
import AppLayout from '../../components/layout/AppLayout'
import Avatar from '../../components/ui/Avatar'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const avatarFileRef = useRef(null)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      avatarFileRef.current = file
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
    }
  }

  const validateProfile = () => {
    const errs = {}
    if (!profileForm.full_name.trim()) errs.full_name = 'Họ tên là bắt buộc'
    return errs
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const errs = validateProfile()
    if (Object.keys(errs).length > 0) { setProfileErrors(errs); return }
    setSavingProfile(true)
    setProfileError('')
    try {
      const formData = new FormData()
      formData.append('full_name', profileForm.full_name)
      if (avatarFileRef.current) formData.append('avatar', avatarFileRef.current)
      const result = await dispatch(updateProfileThunk(formData))
      if (updateProfileThunk.rejected.match(result)) {
        setProfileError(result.payload || 'Lưu thất bại')
      } else {
        avatarFileRef.current = null
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 2500)
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutService()
    } catch {
      // ignore logout errors
    } finally {
      dispatch(logout())
      navigate('/login')
    }
  }

  const validatePassword = () => {
    const errs = {}
    if (!passwordForm.current_password) errs.current_password = 'Mật khẩu hiện tại là bắt buộc'
    if (!passwordForm.new_password) errs.new_password = 'Mật khẩu mới là bắt buộc'
    else if (passwordForm.new_password.length < 6) errs.new_password = 'Mật khẩu phải có ít nhất 6 ký tự'
    if (!passwordForm.confirm_password) errs.confirm_password = 'Vui lòng xác nhận mật khẩu'
    else if (passwordForm.new_password !== passwordForm.confirm_password) errs.confirm_password = 'Mật khẩu không khớp'
    return errs
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    const errs = validatePassword()
    if (Object.keys(errs).length > 0) { setPasswordErrors(errs); return }
    // Password change requires backend support — direct users to forgot-password flow
    setPasswordErrors({ general: 'Để đổi mật khẩu, vui lòng dùng chức năng "Quên mật khẩu" ở trang đăng nhập.' })
  }

  const displayUser = user || {}
  const joinDate = displayUser.created_at
    ? format(new Date(displayUser.created_at), 'MMMM, yyyy')
    : null

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-6">Hồ sơ cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar + basic info */}
          <div className="lg:col-span-1">
            <div className="bg-[#22272B] border border-[#2C333A] rounded-xl p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar
                  src={avatarPreview || displayUser.avatar_url}
                  name={displayUser.full_name}
                  size="xl"
                  className="mx-auto"
                />
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#0C66E4] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#0055CC] transition-colors shadow-lg">
                  <Camera size={14} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{displayUser.full_name}</h2>
              <p className="text-sm text-[#8C9BAB]">{displayUser.email}</p>
              {joinDate && (
                <div className="mt-4 pt-4 border-t border-[#2C333A]">
                  <p className="text-xs text-[#596773]">Thành viên từ</p>
                  <p className="text-sm text-[#B6C2CF] mt-0.5">{joinDate}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="mt-4 w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-full text-sm font-medium transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile Info */}
            <div className="bg-[#22272B] border border-[#2C333A] rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">Thông tin cá nhân</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#B6C2CF] mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => { setProfileForm((f) => ({ ...f, full_name: e.target.value })); setProfileErrors((er) => ({ ...er, full_name: '' })) }}
                    className={`w-full px-3 py-2.5 bg-[#1D2125] border rounded-lg text-[#B6C2CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${profileErrors.full_name ? 'border-red-500' : 'border-[#454F59]'}`}
                  />
                  {profileErrors.full_name && <p className="mt-1 text-xs text-red-400">{profileErrors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B6C2CF] mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-3 py-2.5 bg-[#1D2125] border border-[#454F59] rounded-lg text-[#596773] text-sm cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-[#596773]">Email không thể thay đổi</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0C66E4] hover:bg-[#0055CC] disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    {savingProfile ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : <Save size={14} />}
                    Lưu thay đổi
                  </button>
                  {profileSaved && (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm">
                      <CheckCircle size={15} />
                      Đã lưu!
                    </div>
                  )}
                  {profileError && (
                    <div className="flex items-center gap-1.5 text-red-400 text-sm">
                      <AlertCircle size={15} />
                      {profileError}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Security */}
            <div className="bg-[#22272B] border border-[#2C333A] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={16} className="text-[#8C9BAB]" />
                <h2 className="text-base font-semibold text-white">Bảo mật</h2>
              </div>
              <form onSubmit={handleSavePassword} className="space-y-4">
                {passwordErrors.general && (
                  <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-400 text-sm">
                    {passwordErrors.general}
                  </div>
                )}
                {[
                  { key: 'current_password', label: 'Mật khẩu hiện tại', passKey: 'current' },
                  { key: 'new_password', label: 'Mật khẩu mới', passKey: 'new' },
                  { key: 'confirm_password', label: 'Xác nhận mật khẩu mới', passKey: 'confirm' },
                ].map(({ key, label, passKey }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[#B6C2CF] mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type={showPasswords[passKey] ? 'text' : 'password'}
                        value={passwordForm[key]}
                        onChange={(e) => { setPasswordForm((f) => ({ ...f, [key]: e.target.value })); setPasswordErrors((er) => ({ ...er, [key]: '', general: '' })) }}
                        className={`w-full px-3 py-2.5 pr-10 bg-[#1D2125] border rounded-lg text-[#B6C2CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#0C66E4] ${passwordErrors[key] ? 'border-red-500' : 'border-[#454F59]'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((s) => ({ ...s, [passKey]: !s[passKey] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C9BAB] hover:text-[#B6C2CF]"
                      >
                        {showPasswords[passKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {passwordErrors[key] && <p className="mt-1 text-xs text-red-400">{passwordErrors[key]}</p>}
                  </div>
                ))}
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-full text-sm font-medium transition-colors"
                >
                  <Lock size={14} />
                  Đổi mật khẩu
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
