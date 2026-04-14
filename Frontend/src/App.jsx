import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchMe } from './redux/slices/authSlice'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Workspace pages
import WorkspacesPage from './pages/workspaces/WorkspacesPage'
import CreateWorkspacePage from './pages/workspaces/CreateWorkspacePage'
import BoardListPage from './pages/workspaces/BoardListPage'
import WorkspaceSettingsPage from './pages/workspaces/WorkspaceSettingsPage'

// Board pages
import BoardPage from './pages/boards/BoardPage'

// Profile
import ProfilePage from './pages/profile/ProfilePage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth)
  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const token = localStorage.getItem('token')

  // On startup, if a token exists validate it and refresh user data
  useEffect(() => {
    if (token) {
      dispatch(fetchMe())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Protected routes */}
      <Route path="/home" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
      <Route path="/workspaces/new" element={<ProtectedRoute><CreateWorkspacePage /></ProtectedRoute>} />
      <Route path="/workspaces/:slug" element={<ProtectedRoute><BoardListPage /></ProtectedRoute>} />
      <Route path="/workspaces/:slug/settings" element={<ProtectedRoute><WorkspaceSettingsPage /></ProtectedRoute>} />
      <Route path="/board/:boardId" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
